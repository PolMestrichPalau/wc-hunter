-- =====================================================================
-- WC HUNTER · Esquema Supabase (Fase 1)
-- Ejecutar ENTERO en: Supabase > SQL Editor > New query > Run
-- Requisito previo: Authentication > Sign In / Providers > "Allow anonymous sign-ins" = ON
--
-- Principios de seguridad:
--   * Las tablas NO admiten escritura directa desde el navegador (solo lectura via RLS).
--   * Toda escritura pasa por funciones SECURITY DEFINER que validan y calculan el XP
--     en el servidor (el cliente no puede inflarse puntos).
-- =====================================================================

-- ---------- PERFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar text not null default '🧔',
  title text not null default '🚽 Novato del Retrete',
  xp integer not null default 0 check (xp >= 0),
  streak_days integer not null default 0,
  last_active_date date,
  stats jsonb not null default '{"checkins":0,"discovered":0,"photos":0,"secrets":0}'::jsonb,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_.ñÑáéíóúÁÉÍÓÚ-]{3,24}$'),
  constraint profiles_title_len check (char_length(title) <= 40),
  constraint profiles_avatar_len check (char_length(avatar) <= 8)
);
create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));

-- ---------- WC ----------
create table if not exists public.wcs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text check (char_length(address) <= 120),
  city text check (char_length(city) <= 60),
  country text check (char_length(country) <= 60),
  type text not null default 'other',
  access_type text not null default 'free',
  price numeric(6,2) not null default 0 check (price >= 0 and price <= 100),
  is_secret boolean not null default false,
  rarity text not null default 'COMMON',
  equipment jsonb not null default '{}'::jsonb,
  opening_hours text check (char_length(opening_hours) <= 120),
  source text not null default 'user' check (source in ('user', 'osm')),
  osm_id text unique,
  created_by uuid references public.profiles(id) on delete set null,
  -- agregados (los mantiene check_in)
  checkins_count integer not null default 0,
  score smallint check (score between 0 and 100),
  status text not null default 'open' check (status in ('open', 'closed')),
  paper_ok boolean,
  soap_ok boolean,
  last_checkin_at timestamptz,
  -- moderacion
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint wcs_type_valid check (type in ('public_street','public_park','public_building','shopping_mall','museum','train','restaurant','cafe','luxury_hotel','gas_station','beach','university_top','stadium','airplane','police_station','lighthouse','vip_lounge','other')),
  constraint wcs_access_valid check (access_type in ('free','customers_only','paid','key_required','code_required'))
);
create index if not exists wcs_lat_lng_idx on public.wcs (latitude, longitude);

-- ---------- CHECK-INS ----------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  wc_id uuid not null references public.wcs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint check (rating between 1 and 5),
  status text not null default 'open' check (status in ('open', 'closed')),
  has_paper boolean,
  has_soap boolean,
  comment text check (char_length(comment) <= 280),
  photo_path text check (char_length(photo_path) <= 200),
  distance_m integer,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  constraint checkins_rating_required check (status = 'closed' or rating is not null)
);
create index if not exists checkins_wc_idx on public.checkins (wc_id, created_at desc);
create index if not exists checkins_user_idx on public.checkins (user_id, created_at desc);

-- ---------- REPORTES ----------
create table if not exists public.reports (
  wc_id uuid not null references public.wcs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  primary key (wc_id, user_id)
);

-- ---------- ALTA AUTOMATICA DE PERFIL (login anonimo incluido) ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_try int := 0;
begin
  loop
    v_name := 'Caganer_' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
    exit when not exists (select 1 from public.profiles where lower(username) = lower(v_name));
    v_try := v_try + 1;
    exit when v_try > 8;
  end loop;
  insert into public.profiles (id, username) values (new.id, v_name);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- FUNCIONES AUXILIARES ----------
create or replace function public.haversine_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )))
$$;

create or replace function public.level_for_xp(p_xp integer)
returns integer language sql immutable as $$
  select greatest(1, floor(power(greatest(p_xp, 0) / 100.0, 1 / 1.6))::int + 1)
$$;

-- Rareza por tipo (espejo de js/algorithms.js). Tope LEGENDARY para altas de usuarios.
create or replace function public.rarity_for(p_type text, p_secret boolean)
returns text language plpgsql immutable as $$
declare
  v text;
begin
  v := case p_type
    when 'airplane' then 'EPIC' when 'police_station' then 'EPIC' when 'lighthouse' then 'EPIC' when 'vip_lounge' then 'EPIC'
    when 'train' then 'RARE' when 'stadium' then 'RARE' when 'university_top' then 'RARE'
    when 'luxury_hotel' then 'RARE' when 'museum' then 'RARE' when 'beach' then 'RARE'
    else 'COMMON' end;
  if p_secret then
    v := case v when 'COMMON' then 'RARE' when 'RARE' then 'EPIC' when 'EPIC' then 'LEGENDARY' else v end;
  end if;
  return v;
end $$;

-- Aplica XP, racha y contadores al perfil. Devuelve el perfil resultante.
create or replace function public.apply_xp(p_uid uuid, p_xp integer, p_stat text default null, p_stat_inc integer default 1)
returns public.profiles language plpgsql security definer set search_path = public as $$
declare
  v_p public.profiles;
  v_today date := (now() at time zone 'utc')::date;
  v_streak integer;
begin
  select * into v_p from public.profiles where id = p_uid for update;
  if v_p.last_active_date is null then
    v_streak := greatest(1, v_p.streak_days);
  elsif v_p.last_active_date = v_today then
    v_streak := v_p.streak_days;
  elsif v_p.last_active_date = v_today - 1 then
    v_streak := v_p.streak_days + 1;
  else
    v_streak := 1;
  end if;

  update public.profiles
     set xp = xp + greatest(p_xp, 0),
         streak_days = v_streak,
         last_active_date = v_today,
         stats = case when p_stat is null then stats
                      else jsonb_set(stats, array[p_stat], to_jsonb(coalesce((stats ->> p_stat)::int, 0) + p_stat_inc)) end
   where id = p_uid
   returning * into v_p;
  return v_p;
end $$;

-- ---------- VISTA PUBLICA DE WC (respeta RLS del que consulta) ----------
create or replace view public.wc_view with (security_invoker = true) as
  select w.id, w.name, w.latitude, w.longitude, w.address, w.city, w.country, w.type, w.access_type,
         w.price, w.is_secret, w.rarity, w.equipment, w.opening_hours, w.source,
         w.checkins_count, w.score, w.status, w.paper_ok, w.soap_ok, w.last_checkin_at, w.created_at,
         p.username as discovered_by
    from public.wcs w
    left join public.profiles p on p.id = w.created_by;

-- ---------- LECTURA ----------
create or replace function public.wcs_in_bounds(
  p_min_lat double precision, p_min_lng double precision,
  p_max_lat double precision, p_max_lng double precision,
  p_limit integer default 500
) returns setof public.wc_view language sql stable security invoker set search_path = public as $$
  select * from public.wc_view
   where latitude between p_min_lat and p_max_lat
     and longitude between p_min_lng and p_max_lng
   order by checkins_count desc, created_at desc
   limit least(greatest(p_limit, 1), 1000)
$$;

create or replace function public.nearby_wcs(
  p_lat double precision, p_lng double precision,
  p_radius_m integer default 1000, p_limit integer default 100
) returns setof public.wc_view language sql stable security invoker set search_path = public as $$
  select v.* from public.wc_view v
   where v.latitude between p_lat - (least(p_radius_m, 50000) / 111000.0) and p_lat + (least(p_radius_m, 50000) / 111000.0)
     and v.longitude between p_lng - (least(p_radius_m, 50000) / (111000.0 * greatest(cos(radians(p_lat)), 0.01)))
                         and p_lng + (least(p_radius_m, 50000) / (111000.0 * greatest(cos(radians(p_lat)), 0.01)))
     and public.haversine_m(p_lat, p_lng, v.latitude, v.longitude) <= least(p_radius_m, 50000)
   order by public.haversine_m(p_lat, p_lng, v.latitude, v.longitude)
   limit least(greatest(p_limit, 1), 500)
$$;

create or replace function public.wc_photos(p_wc_id uuid)
returns table (photo_path text, username text, created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select c.photo_path, p.username, c.created_at
    from public.checkins c join public.profiles p on p.id = c.user_id
   where c.wc_id = p_wc_id and c.photo_path is not null
   order by c.created_at desc
   limit 8
$$;

-- ---------- ESCRITURA (validada en servidor) ----------

-- CHECK-IN: valida cercania (<=150 m), cooldown (3 h por WC), limite diario (30) y calcula XP.
create or replace function public.check_in(
  p_wc_id uuid,
  p_rating integer default null,
  p_status text default 'open',
  p_has_paper boolean default null,
  p_has_soap boolean default null,
  p_comment text default null,
  p_photo_path text default null,
  p_lat double precision default null,
  p_lng double precision default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_wc public.wcs%rowtype;
  v_dist double precision;
  v_last timestamptz;
  v_today integer;
  v_xp integer := 15;
  v_bd jsonb := jsonb_build_array(jsonb_build_object('label', 'Check-in', 'xp', 15));
  v_first boolean;
  v_id uuid;
  v_prof public.profiles;
  v_photo_inc integer := 0;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if p_status not in ('open', 'closed') then raise exception 'bad_status'; end if;
  if p_status = 'open' and (p_rating is null or p_rating not between 1 and 5) then raise exception 'bad_rating'; end if;
  if p_rating is not null and p_rating not between 1 and 5 then raise exception 'bad_rating'; end if;
  if p_lat is null or p_lng is null then raise exception 'location_required'; end if;
  -- Formato estricto <uid>/<uuid>.jpg (evita rutas arbitrarias o con caracteres peligrosos)
  if p_photo_path is not null and p_photo_path !~ ('^' || v_uid::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$') then
    raise exception 'bad_photo_path';
  end if;

  select * into v_wc from public.wcs where id = p_wc_id and not hidden;
  if not found then raise exception 'wc_not_found'; end if;

  v_dist := public.haversine_m(p_lat, p_lng, v_wc.latitude, v_wc.longitude);
  if v_dist > 150 then raise exception 'too_far:%', round(v_dist); end if;

  select max(created_at) into v_last from public.checkins where wc_id = p_wc_id and user_id = v_uid;
  if v_last is not null and v_last > now() - interval '3 hours' then
    raise exception 'cooldown:%', ceil(extract(epoch from (v_last + interval '3 hours' - now())) / 60);
  end if;

  select count(*) into v_today from public.checkins where user_id = v_uid and created_at > now() - interval '24 hours';
  if v_today >= 30 then raise exception 'daily_limit'; end if;

  v_first := (v_wc.checkins_count = 0);
  if v_first then
    v_xp := v_xp + 45; v_bd := v_bd || jsonb_build_object('label', '¡Primero en documentarlo!', 'xp', 45);
  end if;
  if v_last is null then
    v_xp := v_xp + 10; v_bd := v_bd || jsonb_build_object('label', 'Primera visita', 'xp', 10);
  end if;
  if p_photo_path is not null then
    v_xp := v_xp + 10; v_bd := v_bd || jsonb_build_object('label', 'Foto', 'xp', 10);
    v_photo_inc := 1;
  end if;

  insert into public.checkins (wc_id, user_id, rating, status, has_paper, has_soap, comment, photo_path, distance_m, xp_awarded)
  values (p_wc_id, v_uid, p_rating, p_status, p_has_paper, p_has_soap, left(btrim(p_comment), 280), p_photo_path, round(v_dist), v_xp)
  returning id into v_id;

  update public.wcs w set
    checkins_count = w.checkins_count + 1,
    last_checkin_at = now(),
    status = p_status,
    paper_ok = coalesce(p_has_paper, w.paper_ok),
    soap_ok = coalesce(p_has_soap, w.soap_ok),
    score = coalesce((
      select round(avg(r.rating) * 20)::smallint
        from (select rating from public.checkins
               where wc_id = p_wc_id and rating is not null
               order by created_at desc limit 20) r
    ), w.score)
  where w.id = p_wc_id;

  v_prof := public.apply_xp(v_uid, v_xp, 'checkins', 1);
  if v_photo_inc = 1 then
    v_prof := public.apply_xp(v_uid, 0, 'photos', 1);
  end if;

  return jsonb_build_object(
    'checkin_id', v_id, 'wc_id', p_wc_id, 'xp_awarded', v_xp, 'breakdown', v_bd,
    'first_to_document', v_first, 'rarity', v_wc.rarity,
    'profile', jsonb_build_object('xp', v_prof.xp, 'level', public.level_for_xp(v_prof.xp), 'streak_days', v_prof.streak_days)
  );
end $$;

-- CREAR WC: el usuario debe estar a <=500 m del pin; avisa de duplicados (<25 m); 10 altas/dia;
-- XP de descubrimiento solo en las 3 primeras altas de cada 24 h.
create or replace function public.create_wc(
  p_name text,
  p_lat double precision,
  p_lng double precision,
  p_user_lat double precision,
  p_user_lng double precision,
  p_type text default 'other',
  p_access_type text default 'free',
  p_price numeric default 0,
  p_is_secret boolean default false,
  p_address text default null,
  p_city text default null,
  p_country text default null,
  p_equipment jsonb default '{}'::jsonb,
  p_force boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g'));
  v_dup uuid;
  v_today integer;
  v_xp integer := 0;
  v_bd jsonb := '[]'::jsonb;
  v_rarity text;
  v_id uuid;
  v_prof public.profiles;
  v_xp_ok boolean;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'bad_name'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'bad_location'; end if;
  if p_user_lat is null or p_user_lng is null then raise exception 'location_required'; end if;
  if public.haversine_m(p_user_lat, p_user_lng, p_lat, p_lng) > 500 then raise exception 'too_far_to_create'; end if;
  if coalesce(p_price, 0) < 0 or coalesce(p_price, 0) > 100 then raise exception 'bad_price'; end if;

  select count(*) into v_today from public.wcs where created_by = v_uid and created_at > now() - interval '24 hours';
  if v_today >= 10 then raise exception 'daily_limit'; end if;

  if not p_force then
    select id into v_dup from public.wcs
     where not hidden
       and latitude between p_lat - 0.0003 and p_lat + 0.0003
       and longitude between p_lng - 0.0005 and p_lng + 0.0005
       and public.haversine_m(p_lat, p_lng, latitude, longitude) < 25
     order by public.haversine_m(p_lat, p_lng, latitude, longitude)
     limit 1;
    if v_dup is not null then raise exception 'duplicate:%', v_dup; end if;
  end if;

  v_rarity := public.rarity_for(p_type, coalesce(p_is_secret, false));

  insert into public.wcs (name, latitude, longitude, address, city, country, type, access_type, price,
                          is_secret, rarity, equipment, source, created_by)
  values (v_name, p_lat, p_lng, left(btrim(p_address), 120), left(btrim(p_city), 60), left(btrim(p_country), 60),
          p_type, p_access_type, coalesce(p_price, 0), coalesce(p_is_secret, false), v_rarity,
          coalesce(p_equipment, '{}'::jsonb), 'user', v_uid)
  returning id into v_id;

  v_xp_ok := v_today < 3;
  if v_xp_ok then
    v_xp := 100; v_bd := v_bd || jsonb_build_object('label', 'Descubrimiento', 'xp', 100);
    if coalesce(p_is_secret, false) then
      v_xp := v_xp + 150; v_bd := v_bd || jsonb_build_object('label', 'WC Secreto', 'xp', 150);
    end if;
    if v_rarity <> 'COMMON' then
      v_xp := v_xp + case v_rarity when 'RARE' then 50 when 'EPIC' then 100 when 'LEGENDARY' then 250 else 0 end;
      v_bd := v_bd || jsonb_build_object('label', 'Rareza ' || v_rarity,
                'xp', case v_rarity when 'RARE' then 50 when 'EPIC' then 100 when 'LEGENDARY' then 250 else 0 end);
    end if;
  end if;

  v_prof := public.apply_xp(v_uid, v_xp, 'discovered', 1);
  if coalesce(p_is_secret, false) then
    v_prof := public.apply_xp(v_uid, 0, 'secrets', 1);
  end if;

  return jsonb_build_object(
    'wc_id', v_id, 'rarity', v_rarity, 'xp_awarded', v_xp, 'breakdown', v_bd, 'xp_limited', not v_xp_ok,
    'profile', jsonb_build_object('xp', v_prof.xp, 'level', public.level_for_xp(v_prof.xp), 'streak_days', v_prof.streak_days)
  );
end $$;

-- REPORTAR: a los 3 reportes distintos el WC se oculta hasta revision.
create or replace function public.report_wc(p_wc_id uuid, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_n integer;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  insert into public.reports (wc_id, user_id, reason) values (p_wc_id, v_uid, left(btrim(p_reason), 200))
    on conflict (wc_id, user_id) do nothing;
  select count(*) into v_n from public.reports where wc_id = p_wc_id;
  if v_n >= 3 then update public.wcs set hidden = true where id = p_wc_id; end if;
  return jsonb_build_object('reports', v_n, 'hidden', v_n >= 3);
end $$;

-- PERFIL
create or replace function public.my_profile()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'username', p.username, 'avatar', p.avatar, 'title', p.title,
                            'xp', p.xp, 'level', public.level_for_xp(p.xp), 'streak_days', p.streak_days, 'stats', p.stats)
    from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.set_profile(p_username text default null, p_avatar text default null, p_title text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  begin
    update public.profiles
       set username = coalesce(btrim(p_username), username),
           avatar = coalesce(p_avatar, avatar),
           title = coalesce(p_title, title)
     where id = v_uid;
  exception
    when unique_violation then raise exception 'username_taken';
    when check_violation then raise exception 'bad_profile';
  end;
  return public.my_profile();
end $$;

-- ---------- SEGURIDAD: RLS + PERMISOS ----------
alter table public.profiles enable row level security;
alter table public.wcs enable row level security;
alter table public.checkins enable row level security;
alter table public.reports enable row level security;

drop policy if exists profiles_read on public.profiles;
drop policy if exists wcs_read on public.wcs;
drop policy if exists checkins_read on public.checkins;
create policy profiles_read on public.profiles for select using (true);
create policy wcs_read on public.wcs for select using (not hidden);
create policy checkins_read on public.checkins for select using (true);
-- reports: sin politicas => nadie puede leer ni escribir directamente.

-- Sin escritura directa desde el navegador
revoke insert, update, delete, truncate on public.profiles, public.wcs, public.checkins, public.reports from anon, authenticated;
revoke all on public.reports from anon, authenticated;

-- Funciones internas: nadie desde el cliente
revoke all on function public.apply_xp(uuid, integer, text, integer) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Funciones de escritura: solo usuarios con sesion (incluye anonimos)
revoke all on function public.check_in(uuid, integer, text, boolean, boolean, text, text, double precision, double precision) from public, anon;
revoke all on function public.create_wc(text, double precision, double precision, double precision, double precision, text, text, numeric, boolean, text, text, text, jsonb, boolean) from public, anon;
revoke all on function public.report_wc(uuid, text) from public, anon;
revoke all on function public.my_profile() from public, anon;
revoke all on function public.set_profile(text, text, text) from public, anon;
grant execute on function public.check_in(uuid, integer, text, boolean, boolean, text, text, double precision, double precision) to authenticated;
grant execute on function public.create_wc(text, double precision, double precision, double precision, double precision, text, text, numeric, boolean, text, text, text, jsonb, boolean) to authenticated;
grant execute on function public.report_wc(uuid, text) to authenticated;
grant execute on function public.my_profile() to authenticated;
grant execute on function public.set_profile(text, text, text) to authenticated;

-- Lectura publica
grant select on public.wc_view to anon, authenticated;
grant execute on function public.wcs_in_bounds(double precision, double precision, double precision, double precision, integer) to anon, authenticated;
grant execute on function public.nearby_wcs(double precision, double precision, integer, integer) to anon, authenticated;
grant execute on function public.wc_photos(uuid) to anon, authenticated;
