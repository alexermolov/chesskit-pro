import NavLink from "@/components/NavLink";
import { useChessActions } from "@/hooks/useChessActions";
import {
  boardAtom,
  currentPositionAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import { Icon } from "@iconify/react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useSetAtom } from "jotai";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import NavMenu from "./NavMenu";

interface Props {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function NavBar({ darkMode, switchDarkMode }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  // Chess game reset functionality
  const { reset: resetGame } = useChessActions(gameAtom);
  const { reset: resetBoard } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setCurrentPosition = useSetAtom(currentPositionAtom);
  const setEvaluationProgress = useSetAtom(evaluationProgressAtom);

  const resetGameToInitialPosition = () => {
    // Reset game and board to initial chess position
    resetGame({ noHeaders: true });
    resetBoard({ noHeaders: true });

    // Clear evaluation data
    setEval(undefined);
    setCurrentPosition({});
    setEvaluationProgress(0);
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [router.pathname]);

  return (
    <Box sx={{ flexGrow: 1, display: "flex" }}>
      <AppBar
        position="static"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: darkMode ? "#19191c" : "white",
          color: darkMode ? "white" : "black",
        }}
        enableColorOnDark
      >
        <Toolbar variant="dense">
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: "min(0.5vw, 0.6rem)", padding: 1, my: 1 }}
            onClick={() => setDrawerOpen((val) => !val)}
          >
            <Icon icon="mdi:menu" />
          </IconButton>

          <Image
            src="./favicon-32x32.png"
            alt="Chesskit logo"
            width={32}
            height={32}
          />

          <NavLink href="/" onClick={resetGameToInitialPosition}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: 1,
                ml: 1,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              Chesskit
            </Typography>
          </NavLink>

          <IconButton
            sx={{ ml: "min(0.6rem, 0.8vw)" }}
            onClick={switchDarkMode}
            color="inherit"
            edge="end"
          >
            {darkMode ? (
              <Icon icon="mdi:brightness-7" />
            ) : (
              <Icon icon="mdi:brightness-4" />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      <NavMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}
