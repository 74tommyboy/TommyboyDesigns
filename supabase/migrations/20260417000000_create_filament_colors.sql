create table filament_colors (
  id integer primary key,
  color_name text not null,
  color_hex text not null,
  material text not null default '',
  remaining_weight numeric,
  archived boolean not null default false,
  synced_at timestamptz not null default now()
);

alter table filament_colors enable row level security;

create policy "filament_colors_read"
  on filament_colors for select
  to anon, authenticated
  using (true);
