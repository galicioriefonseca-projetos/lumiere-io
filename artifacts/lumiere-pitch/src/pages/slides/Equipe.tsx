export default function Equipe() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 0%, rgba(19,39,96,0.2) 0%, transparent 60%)",
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

      <div className="absolute inset-0 flex flex-col px-[8vw] py-[8vh]">
        <div className="mb-[5vh]">
          <p
            className="font-body uppercase mb-[1.5vh]"
            style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.2em" }}
          >
            Equipe
          </p>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "4vw", color: "#f9f7f0", textWrap: "balance" }}
          >
            Construído por quem entende o setor
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[5vw] flex-1">
          <div className="flex-1 flex flex-col">
            <div
              className="w-[6vw] h-[6vw] mb-[3vh] flex items-center justify-center"
              style={{
                background: "rgba(232,178,58,0.08)",
                border: "0.1vh solid rgba(232,178,58,0.3)",
                borderRadius: "50%",
              }}
            >
              <span
                className="font-display font-bold"
                style={{ fontSize: "2.8vw", color: "#e8b23a" }}
              >
                F
              </span>
            </div>
            <h3
              className="font-display font-semibold mb-[1vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Fundador & CEO
            </h3>
            <p
              className="font-body mb-[3vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.55 }}
            >
              Visão de produto e estratégia de negócios. Experiência em gestão de salões e construção de produto.
            </p>
            <div
              className="mt-auto h-[0.15vh]"
              style={{ background: "rgba(232,178,58,0.3)" }}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div
              className="w-[6vw] h-[6vw] mb-[3vh] flex items-center justify-center"
              style={{
                background: "rgba(232,178,58,0.08)",
                border: "0.1vh solid rgba(232,178,58,0.3)",
                borderRadius: "50%",
              }}
            >
              <span
                className="font-display font-bold"
                style={{ fontSize: "2.8vw", color: "#e8b23a" }}
              >
                T
              </span>
            </div>
            <h3
              className="font-display font-semibold mb-[1vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Co-fundador & CTO
            </h3>
            <p
              className="font-body mb-[3vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.55 }}
            >
              Engenharia full-stack e arquitetura de produto. Histórico em SaaS B2B e desenvolvimento de apps móveis.
            </p>
            <div
              className="mt-auto h-[0.15vh]"
              style={{ background: "rgba(232,178,58,0.3)" }}
            />
          </div>

          <div className="flex-1 flex flex-col">
            <div
              className="w-[6vw] h-[6vw] mb-[3vh] flex items-center justify-center"
              style={{
                background: "rgba(232,178,58,0.08)",
                border: "0.1vh solid rgba(232,178,58,0.3)",
                borderRadius: "50%",
              }}
            >
              <span
                className="font-display font-bold"
                style={{ fontSize: "2.8vw", color: "#e8b23a" }}
              >
                G
              </span>
            </div>
            <h3
              className="font-display font-semibold mb-[1vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Head de Crescimento
            </h3>
            <p
              className="font-body mb-[3vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.55 }}
            >
              Expansão de mercado, parcerias com redes de salões e estratégia de go-to-market lusófono.
            </p>
            <div
              className="mt-auto h-[0.15vh]"
              style={{ background: "rgba(232,178,58,0.3)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
