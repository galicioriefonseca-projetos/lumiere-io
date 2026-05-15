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

      <div className="absolute inset-0 flex flex-col px-[8vw] py-[8vh]">
        <div className="mb-[5vh]">
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

        <div className="flex flex-col flex-1 justify-center gap-[4.5vh]">
          <div className="flex items-start gap-[3vw]">
            <div
              className="font-display font-bold shrink-0"
              style={{ fontSize: "3vw", color: "#e8b23a", minWidth: "7vw" }}
            >
              Web
            </div>
            <div>
              <p
                className="font-display font-semibold mb-[0.8vh]"
                style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
              >
                Plataforma web completa — 26 telas funcionais
              </p>
              <p
                className="font-body"
                style={{ fontSize: "2vw", color: "#9d9a8c" }}
              >
                Gestão de agendamentos, avaliações, equipe, comissões, metas e modo TV.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[3vw]">
            <div
              className="font-display font-bold shrink-0"
              style={{ fontSize: "3vw", color: "#e8b23a", minWidth: "7vw" }}
            >
              Mobile
            </div>
            <div>
              <p
                className="font-display font-semibold mb-[0.8vh]"
                style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
              >
                Aplicativo nativo para iOS e Android
              </p>
              <p
                className="font-body"
                style={{ fontSize: "2vw", color: "#9d9a8c" }}
              >
                Dashboard em tempo real, equipe, agenda e conquistas acessíveis de qualquer lugar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-[3vw]">
            <div
              className="font-display font-bold shrink-0"
              style={{ fontSize: "3vw", color: "#e8b23a", minWidth: "7vw" }}
            >
              Beta
            </div>
            <div>
              <p
                className="font-display font-semibold mb-[0.8vh]"
                style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
              >
                Fase beta com primeiros salões parceiros
              </p>
              <p
                className="font-body"
                style={{ fontSize: "2vw", color: "#9d9a8c" }}
              >
                Feedback direto de donos e profissionais para iterar o produto com velocidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
