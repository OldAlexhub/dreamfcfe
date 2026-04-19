function isValidDate(value) {
  if (!value) {
    return false;
  }

  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime());
}

export function formatCountdown(dateValue) {
  if (!isValidDate(dateValue)) {
    return "24h";
  }

  const totalMilliseconds = new Date(dateValue).getTime() - Date.now();

  if (totalMilliseconds <= 0) {
    return "Ready now";
  }

  const totalMinutes = Math.floor(totalMilliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default function formatDate(dateValue) {
  if (!isValidDate(dateValue)) {
    return "No cooldown active";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateValue));
}
