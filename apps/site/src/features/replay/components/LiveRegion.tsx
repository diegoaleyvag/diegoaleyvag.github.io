interface LiveRegionProps {
  readonly message: string;
}

/**
 * A restrained, single status region for variant/run lifecycle updates. Only
 * meaningful transitions (selection, load result) change `message`, so this
 * does not repeatedly interrupt screen reader users.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <p class="status-message live-region" role="status" aria-live="polite">
      {message}
    </p>
  );
}
