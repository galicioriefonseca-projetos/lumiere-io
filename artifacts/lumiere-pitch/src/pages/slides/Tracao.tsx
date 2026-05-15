export default function Tracao() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 95% 50%, rgba(19,39,96,0.2) 0%, transparent 60%)",
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
            Tração
          </p>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "4vw", color: "#f9f7f0" }}
          >
            Onde estamos hoje
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[4vw] flex-1">
          <div className="flex flex-col gap-[3vh] flex-1">
            <div className="flex items-start gap-[2.5vw]">
              <div
                className="font-display font-bold shrink-0"
                style={{ fontSize: "2.6vw", color: "#e8b23a", minWidth: "6vw" }}
              >
                Web
              </div>
              <div>
                <p
                  className="font-display font-semibold mb-[0.6vh]"
                  style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
                >
                  Plataforma completa — 26 telas funcionais
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
                >
                  Agendamentos, avaliações, comissões, metas, gamificação e modo TV.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[2.5vw]">
              <div
                className="font-display font-bold shrink-0"
                style={{ fontSize: "2.6vw", color: "#e8b23a", minWidth: "6vw" }}
              >
                Mobile
              </div>
              <div>
                <p
                  className="font-display font-semibold mb-[0.6vh]"
                  style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
                >
                  App nativo iOS & Android — 5 módulos
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
                >
                  Dashboard em tempo real, equipe, agenda e conquistas acessíveis de qualquer lugar.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-[2.5vw]">
              <div
                className="font-display font-bold shrink-0"
                style={{ fontSize: "2.6vw", color: "#e8b23a", minWidth: "6vw" }}
              >
                Beta
              </div>
              <div>
                <p
                  className="font-display font-semibold mb-[0.6vh]"
                  style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
                >
                  12 salões parceiros em fase beta fechada
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
                >
                  São Paulo, Rio de Janeiro e Porto Alegre — feedback direto para iterar o produto.
                </p>
              </div>
            </div>
          </div>

          <div
            className="flex flex-col justify-center gap-[2.5vh] shrink-0"
            style={{ width: "28vw" }}
          >
            {[
              { value: "8.400+", label: "agendamentos gerenciados" },
              { value: "4,8 ★", label: "avaliação média dos profissionais" },
              { value: "91%", label: "retenção semanal na plataforma" },
              { value: "R$ 0", label: "custo de aquisição (beta orgânico)" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="px-[2vw] py-[1.8vh]"
                style={{
                  background: "rgba(11,18,37,0.8)",
                  border: "0.1vh solid rgba(232,178,58,0.25)",
                }}
              >
                <p
                  className="font-display font-bold leading-none mb-[0.6vh]"
                  style={{ fontSize: "2.8vw", color: "#e8b23a" }}
                >
                  {value}
                </p>
                <p
                  className="font-body"
                  style={{ fontSize: "1.6vw", color: "#9d9a8c" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
