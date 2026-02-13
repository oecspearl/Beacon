import type { StatusCode } from "@beacon/shared";

export interface DecodedSMS {
  studentId: string;
  latitude: number;
  longitude: number;
  status: StatusCode;
  timestamp: Date;
}

const VALID_STATUSES = new Set<string>(["OK", "MV", "NA", "UR", "DT", "MED"]);
const SEPARATOR = "|";

export function decodeSMS(message: string): DecodedSMS {
  const parts = message.split(SEPARATOR);

  if (parts.length !== 5 || parts[0] !== "BCN") {
    throw new Error("Invalid Beacon SMS format");
  }

  const studentId = parts[1]!;
  const coords = parts[2]!;
  const statusStr = parts[3]!;
  const tsBase36 = parts[4]!;

  if (!VALID_STATUSES.has(statusStr)) {
    throw new Error(`Invalid status code: ${statusStr}`);
  }

  const coordParts = coords.split(",");
  const latitude = parseFloat(coordParts[0]!);
  const longitude = parseFloat(coordParts[1]!);

  if (isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Invalid coordinates");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error("Coordinates out of range");
  }

  const timestamp = new Date(parseInt(tsBase36, 36) * 1000);

  if (isNaN(timestamp.getTime())) {
    throw new Error("Invalid timestamp");
  }

  return {
    studentId,
    latitude,
    longitude,
    status: statusStr as StatusCode,
    timestamp,
  };
}
