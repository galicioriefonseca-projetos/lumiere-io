const years = [
  {
    year: "Ano 1",
    salons: "150 salões",
    arr: "R$ 540k",
    arrRaw: 540,
    mix: "Essencial + Pro",
    highlight: false,
  },
  {
    year: "Ano 2",
    salons: "600 salões",
    arr: "R$ 2,4M",
    arrRaw: 2400,
    mix: "Escala Pro + primeiros Enterprise",
    highlight: true,
  },
  {
    year: "Ano 3",
    salons: "1.800 salões",
    arr: "R$ 8,1M",
    arrRaw: 8100,
    mix: "0,2% do mercado endereçável",
    highlight: false,
  },
];

const maxArr = 8100;

export default function ProjecaoFinanceira() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 100% 0%, rgba(19,39,96,0.25) 0%, transparent 60%)",
        }}
      />

      <div className="absolute top-[3.5vh] right-[5vw]">
        <span
          className="font-display font-semibold"
          style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
        >
          LUMIÈRE.IO
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col px-[8vw] py-[7vh]">
        <div className="mb-[4vh]">
          <p
            className="font-body uppercase mb-[1.5vh]"
            style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.2em" }}
          >
            Projeção Financeira
          </p>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "4vw", color: "#f9f7f0" }}
          >
            Modelo ARR — Anos 1 a 3
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[3vw] flex-1 items-stretch">
          {years.map(({ year, salons, arr, arrRaw, mix, highlight }) => {
            const barHeight = Math.round((arrRaw / maxArr) * 100);
            return (
              <div
                key={year}
                className="flex-1 flex flex-col px-[2.5vw] py-[3vh]"
                style={{
                  background: highlight
                    ? "rgba(19,39,96,0.45)"
                    : "rgba(11,18,37,0.8)",
                  border: highlight
                    ? "0.15vh solid rgba(232,178,58,0.65)"
                    : "0.1vh solid rgba(232,178,58,0.2)",
                }}
              >
                <p
                  className="font-body uppercase mb-[2.5vh]"
                  style={{
                    fontSize: "1.4vw",
                    color: highlight ? "#e8b23a" : "#9d9a8c",
                    letterSpacing: "0.15em",
                  }}
                >
                  {year}
                </p>

                <div
                  className="flex items-end mb-[2.5vh]"
                  style={{ height: "18vh" }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${barHeight}%`,
                      background: highlight
                        ? "linear-gradient(180deg, #e8b23a 0%, rgba(232,178,58,0.5) 100%)"
                        : "linear-gradient(180deg, rgba(232,178,58,0.5) 0%, rgba(232,178,58,0.15) 100%)",
                      transition: "height 0.4s ease",
                    }}
                  />
                </div>

                <p
                  className="font-display font-bold leading-none mb-[1vh]"
                  style={{
                    fontSize: "3.5vw",
                    color: highlight ? "#e8b23a" : "#f9f7f0",
                  }}
                >
                  {arr}
                </p>
                <p
                  className="font-body mb-[1vh]"
                  style={{ fontSize: "1.8vw", color: "#f9f7f0" }}
                >
                  {salons}
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "1.6vw", color: "#9d9a8c" }}
                >
                  {mix}
                </p>
              </div>
            );
          })}
        </div>

        <div
          className="flex gap-[6vw] mt-[3vh] pt-[2vh]"
          style={{ borderTop: "0.1vh solid rgba(232,178,58,0.15)" }}
        >
          <p className="font-body" style={{ fontSize: "1.6vw", color: "#9d9a8c" }}>
            Premissas: ticket médio Pro R$ 399/mês · churn mensal 2,5% · crescimento
            orgânico + referral
          </p>
          <p
            className="font-body shrink-0"
            style={{ fontSize: "1.6vw", color: "#9d9a8c" }}
          >
            TAM Brasil: 800k salões
          </p>
        </div>
      </div>
    </div>
  );
}
