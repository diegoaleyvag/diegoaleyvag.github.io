interface LiveRegionProps {
  readonly message: string;
}

/**
 * A single polite status region for map-selection announcements. Only a
 * completed selection updates `message`, so screen reader users get one
 * clear sentence per choice rather than a stream of interruptions.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <p class="capability-map__live-region" role="status" aria-live="polite">
      {message}
    </p>
  );
}
