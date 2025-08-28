import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const get = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mq.addEventListener?.("change", onChange) || mq.addListener(onChange);
    return () =>
      mq.removeEventListener?.("change", onChange) || mq.removeListener(onChange);
  }, [query]);

  return matches;
}
