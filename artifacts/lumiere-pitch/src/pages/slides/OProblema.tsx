export default function OProblema() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 90%, rgba(19,39,96,0.25) 0%, transparent 70%)",
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
            O Problema
          </p>
          <h2
            className="font-display font-bold tracking-tight leading-tight"
            style={{ fontSize: "4.5vw", color: "#f9f7f0", textWrap: "balance" }}
          >
            <span className="block">O setor ainda opera</span>
            <span className="block">no passado</span>
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[4vw] flex-1">
          <div className="flex-1">
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "5vw", color: "#e8b23a", lineHeight: 1 }}
            >
              01
            </div>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              Controle fragmentado
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Planilhas, cadernos e aplicativos desconectados que não se comunicam entre si.
            </p>
          </div>

          <div className="flex-1">
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "5vw", color: "#e8b23a", lineHeight: 1 }}
            >
              02
            </div>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              Equipe sem métricas
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Profissionais gerenciados sem metas claras, comissões opacas e ausência de reconhecimento.
            </p>
          </div>

          <div className="flex-1">
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "5vw", color: "#e8b23a", lineHeight: 1 }}
            >
              03
            </div>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              Decisões sem dados
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Donos de salão gerenciam por intuição, sem visibilidade real de receita ou desempenho.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
