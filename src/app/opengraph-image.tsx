import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Ownbase — Your Software. Your Base.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logoBase64 = readFileSync(
    join(process.cwd(), "public/LOGO/Logo-Icon.png")
  ).toString("base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080c14 0%, #0b1a24 55%, #081720 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 128,
              height: 128,
              borderRadius: 28,
              background: "#eef2f7",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${logoBase64}`}
              width={84}
              height={66}
              alt=""
            />
          </div>
          <span
            style={{
              fontSize: 84,
              fontWeight: 600,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            Ownbase
          </span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 32,
            fontSize: 32,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 860,
          }}
        >
          Your Software. Your Base.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            width: 120,
            height: 6,
            borderRadius: 999,
            background: "linear-gradient(90deg, #22d3ee, #7c3aed)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
