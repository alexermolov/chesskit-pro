import React from "react";

interface FlagSvgProps {
  countryCode: string;
  width?: number;
  height?: number;
}

const FlagSvg: React.FC<FlagSvgProps> = ({
  countryCode,
  width = 20,
  height = 15,
}) => {
  const flags: Record<string, React.JSX.Element> = {
    US: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="us-a">
            <path fillOpacity=".7" d="M0 0h640v480H0z" />
          </clipPath>
        </defs>
        <g fillRule="evenodd" clipPath="url(#us-a)">
          <g strokeWidth="1pt">
            <path
              fill="#bd3d44"
              d="M0 0h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640z"
            />
            <path
              fill="#fff"
              d="M0 37h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640zm0 74h640v37h-640z"
            />
          </g>
          <path fill="#192f5d" d="M0 0h364v259h-364z" />
          <g fill="#fff">
            <g id="us-d">
              <g id="us-c">
                <g id="us-e">
                  <g id="us-b">
                    <path
                      id="us-f"
                      d="M42 13l5 16h16l-13 10 5 15-13-9-13 9 5-15-13-10h16z"
                    />
                    <use href="#us-f" transform="translate(64)" />
                    <use href="#us-f" transform="translate(128)" />
                    <use href="#us-f" transform="translate(192)" />
                    <use href="#us-f" transform="translate(256)" />
                  </g>
                  <use href="#us-b" transform="translate(0 37)" />
                </g>
                <use href="#us-e" transform="translate(0 74)" />
              </g>
              <use href="#us-c" transform="translate(0 111)" />
            </g>
            <use href="#us-d" transform="translate(32 18.5)" />
          </g>
        </g>
      </svg>
    ),
    RU: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fillRule="evenodd" strokeWidth="1pt">
          <rect fill="#fff" width="640" height="480" />
          <rect fill="#0039a6" y="160" width="640" height="320" />
          <rect fill="#d52b1e" y="320" width="640" height="160" />
        </g>
      </svg>
    ),
    ES: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#aa151b" d="M0 0h640v480H0z" />
        <path fill="#f1bf00" d="M0 120h640v240H0z" />
      </svg>
    ),
    IT: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fillRule="evenodd" strokeWidth="1pt">
          <path fill="#fff" d="M0 0h640v480H0z" />
          <path fill="#009246" d="M0 0h213.3v480H0z" />
          <path fill="#ce2b37" d="M426.7 0H640v480H426.7z" />
        </g>
      </svg>
    ),
    DE: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path fill="#ffce00" d="M0 320h640v160H0z" />
        <path d="M0 0h640v160H0z" />
        <path fill="#d00" d="M0 160h640v160H0z" />
      </svg>
    ),
    FR: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fillRule="evenodd" strokeWidth="1pt">
          <path fill="#fff" d="M0 0h640v480H0z" />
          <path fill="#002654" d="M0 0h213.3v480H0z" />
          <path fill="#ce1126" d="M426.7 0H640v480H426.7z" />
        </g>
      </svg>
    ),
    NL: (
      <svg
        width={width}
        height={height}
        viewBox="0 0 640 480"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fillRule="evenodd" strokeWidth="1pt">
          <rect fill="#21468b" y="320" width="640" height="160" />
          <rect fill="#fff" y="160" width="640" height="160" />
          <rect fill="#ae1c28" width="640" height="160" />
        </g>
      </svg>
    ),
  };

  return flags[countryCode] || flags["US"];
};

export default FlagSvg;
