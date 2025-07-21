import { Link as MuiLink } from "@mui/material";
import NextLink from "next/link";
import { ReactNode } from "react";

export default function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <MuiLink
      component={NextLink}
      href={href}
      underline="none"
      color="inherit"
      sx={{ width: "100%" }}
      onClick={onClick}
    >
      {children}
    </MuiLink>
  );
}
