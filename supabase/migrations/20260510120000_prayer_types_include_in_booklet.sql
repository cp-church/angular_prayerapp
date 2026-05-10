-- Prayer prompt categories (prayer_types): optional inclusion in saddle-stitch booklet after answered prayers.
alter table public.prayer_types
  add column if not exists include_in_booklet boolean not null default false;

comment on column public.prayer_types.include_in_booklet is 'When true and the type is active, prompts of this category may appear in the admin saddle-stitch booklet (Tools).';
