import React from "react";
import FlagSvg from "./FlagSvg";

interface FlagIconProps {
  countryCode: string;
  languageCode: string;
}

const languageNames: Record<string, string> = {
  en: "EN",
  ru: "RU",
  es: "ES",
  it: "IT",
  de: "DE",
  fr: "FR",
  nl: "NL",
};

export default function FlagIcon({ countryCode, languageCode }: FlagIconProps) {
  const languageName =
    languageNames[languageCode] || languageCode.toUpperCase();

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <FlagSvg countryCode={countryCode} width={20} height={15} />
      <span style={{ fontSize: "14px", fontWeight: 500 }}>{languageName}</span>
    </span>
  );
}
