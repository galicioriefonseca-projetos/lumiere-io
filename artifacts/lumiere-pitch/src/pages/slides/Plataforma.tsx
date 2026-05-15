export default function Plataforma() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 85% 10%, rgba(19,39,96,0.3) 0%, transparent 60%)",
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
            Plataforma
          </p>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "4vw", color: "#f9f7f0", textWrap: "balance" }}
          >
            Módulos essenciais, design de alto nível
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[3vw] flex-1">
          <div
            className="flex-1 pt-[2.5vh]"
            style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
          >
            <p
              className="font-body uppercase mb-[1.5vh]"
              style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
            >
              01 · Agenda
            </p>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Agendamentos
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Gestão visual da agenda com status em tempo real e histórico completo de atendimentos.
            </p>
          </div>

          <div
            className="flex-1 pt-[2.5vh]"
            style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
          >
            <p
              className="font-body uppercase mb-[1.5vh]"
              style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
            >
              02 · Equipe
            </p>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Avaliações
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Sistema de avaliação de clientes com notas, comentários e relatório de desempenho.
            </p>
          </div>

          <div
            className="flex-1 pt-[2.5vh]"
            style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
          >
            <p
              className="font-body uppercase mb-[1.5vh]"
              style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
            >
              03 · Financeiro
            </p>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Comissões
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Cálculo automático por profissional, serviço e período — sem planilhas manuais.
            </p>
          </div>

          <div
            className="flex-1 pt-[2.5vh]"
            style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
          >
            <p
              className="font-body uppercase mb-[1.5vh]"
              style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
            >
              04 · Engajamento
            </p>
            <h3
              className="font-display font-semibold mb-[1.5vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Gamificação
            </h3>
            <p
              className="font-body"
              style={{ fontSize: "2vw", color: "#9d9a8c", lineHeight: 1.5 }}
            >
              Conquistas, metas e rankings que motivam profissionais e reduzem rotatividade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
