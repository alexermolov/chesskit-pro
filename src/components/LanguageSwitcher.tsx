import {
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useCallback } from "react";
import FlagIcon from "./FlagIcon";
import { changeLanguageInElectron, isElectron } from "@/lib/i18nElectron";

interface LanguageSwitcherProps {
  size?: "small" | "medium";
}

export default function LanguageSwitcher({
  size = "small",
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation("common");
  const router = useRouter();

  const handleLanguageChange = useCallback(
    async (event: SelectChangeEvent<string>) => {
      const newLocale = event.target.value;

      if (isElectron()) {
        // In Electron, change the language directly via i18n
        try {
          await changeLanguageInElectron(newLocale);
          // Save the selected language in localStorage
          localStorage.setItem("i18nextLng", newLocale);
        } catch (error) {
          console.error("Failed to change language in Electron:", error);
        }
      } else {
        // In the browser, use Next.js routing
        router.push(
          {
            pathname: router.pathname,
            query: router.query,
          },
          router.asPath,
          { locale: newLocale }
        );
      }
    },
    [router]
  );

  return (
    <FormControl size={size} variant="outlined">
      <Select
        value={i18n.language}
        onChange={handleLanguageChange}
        displayEmpty
        inputProps={{ "aria-label": t("language") }}
        renderValue={(value) => (
          <FlagIcon
            countryCode={value === "en" ? "US" : value.toUpperCase()}
            languageCode={value}
          />
        )}
        sx={{
          minWidth: 80,
          "& .MuiSelect-select": {
            paddingY: 0.5,
          },
        }}
      >
        <MenuItem value="en">
          <FlagIcon countryCode="US" languageCode="en" />
        </MenuItem>
        <MenuItem value="ru">
          <FlagIcon countryCode="RU" languageCode="ru" />
        </MenuItem>
        <MenuItem value="es">
          <FlagIcon countryCode="ES" languageCode="es" />
        </MenuItem>
        <MenuItem value="it">
          <FlagIcon countryCode="IT" languageCode="it" />
        </MenuItem>
        <MenuItem value="de">
          <FlagIcon countryCode="DE" languageCode="de" />
        </MenuItem>
        <MenuItem value="fr">
          <FlagIcon countryCode="FR" languageCode="fr" />
        </MenuItem>
        <MenuItem value="nl">
          <FlagIcon countryCode="NL" languageCode="nl" />
        </MenuItem>
      </Select>
    </FormControl>
  );
}
