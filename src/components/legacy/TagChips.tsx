type TagChipsProps = {
  tags: string[];
  onClick?: (tag: string) => void;
};

export function TagChips({ tags, onClick }: TagChipsProps) {
  if (!tags?.length) return null;

  return (
    <div className="card-related-tags">
      {tags.map((tag, index) => (
        <button
          key={`${tag}-${index}`}
          type="button"
          className="card-related-tag"
          onClick={onClick ? () => onClick(tag) : undefined}
          style={onClick ? { cursor: "pointer" } : undefined}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
