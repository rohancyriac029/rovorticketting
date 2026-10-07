/**
 * Inline facts separated by a centred dot. Every item carries a leading dot and the list is pulled
 * left by exactly that width inside an overflow-hidden wrapper, so the dot at the start of each
 * wrapped line is clipped instead of being left stranded.
 */
export function MetaList({
  items,
  className = '',
}: {
  items: (string | null | undefined | false)[];
  className?: string;
}) {
  const visible = items.filter((item): item is string => Boolean(item));
  return (
    <div className={`overflow-hidden ${className}`}>
      <ul className="-ml-[19px] flex flex-wrap gap-y-1">
        {visible.map((item) => (
          <li key={item} className="flex items-center">
            <span aria-hidden className="mx-2 h-[3px] w-[3px] shrink-0 rounded-full bg-faint" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
