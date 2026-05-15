export default function ModeloDeNegocios() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 70% at 0% 100%, rgba(19,39,96,0.2) 0%, transparent 60%)",
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
            Modelo de Negócios
          </p>
          <h2
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "4vw", color: "#f9f7f0" }}
          >
            SaaS por assinatura mensal
          </h2>
          <div
            className="w-[5vw] h-[0.2vh] mt-[2vh]"
            style={{ background: "#e8b23a" }}
          />
        </div>

        <div className="flex gap-[3vw] flex-1">
          <div
            className="flex-1 flex flex-col px-[2.5vw] py-[3vh]"
            style={{
              background: "rgba(11,18,37,0.8)",
              border: "0.1vh solid rgba(232,178,58,0.2)",
            }}
          >
            <p
              className="font-body uppercase mb-[2vh]"
              style={{ fontSize: "1.5vw", color: "#9d9a8c", letterSpacing: "0.15em" }}
            >
              Essencial
            </p>
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "3.2vw", color: "#f9f7f0" }}
            >
              Entrada
            </div>
            <div
              className="w-full mb-[2.5vh]"
              style={{ height: "0.1vh", background: "rgba(232,178,58,0.2)" }}
            />
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c" }}
            >
              Até 5 profissionais
            </p>
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c" }}
            >
              Agenda + avaliações
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
              Plataforma web
            </p>
          </div>

          <div
            className="flex-1 flex flex-col px-[2.5vw] py-[3vh]"
            style={{
              background: "rgba(19,39,96,0.4)",
              border: "0.15vh solid rgba(232,178,58,0.6)",
            }}
          >
            <p
              className="font-body uppercase mb-[2vh]"
              style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
            >
              Pro
            </p>
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "3.2vw", color: "#e8b23a" }}
            >
              Completo
            </div>
            <div
              className="w-full mb-[2.5vh]"
              style={{ height: "0.1vh", background: "rgba(232,178,58,0.4)" }}
            />
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#f9f7f0" }}
            >
              Equipe ilimitada
            </p>
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#f9f7f0" }}
            >
              Comissões + metas
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#f9f7f0" }}>
              Gamificação + mobile
            </p>
          </div>

          <div
            className="flex-1 flex flex-col px-[2.5vw] py-[3vh]"
            style={{
              background: "rgba(11,18,37,0.8)",
              border: "0.1vh solid rgba(232,178,58,0.2)",
            }}
          >
            <p
              className="font-body uppercase mb-[2vh]"
              style={{ fontSize: "1.5vw", color: "#9d9a8c", letterSpacing: "0.15em" }}
            >
              Enterprise
            </p>
            <div
              className="font-display font-bold mb-[2vh]"
              style={{ fontSize: "3.2vw", color: "#f9f7f0" }}
            >
              Redes
            </div>
            <div
              className="w-full mb-[2.5vh]"
              style={{ height: "0.1vh", background: "rgba(232,178,58,0.2)" }}
            />
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c" }}
            >
              Múltiplas unidades
            </p>
            <p
              className="font-body mb-[1.2vh]"
              style={{ fontSize: "2vw", color: "#9d9a8c" }}
            >
              Dashboard consolidado
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
              Sob consulta
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
