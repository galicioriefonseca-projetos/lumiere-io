export default function Mercado() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, rgba(19,39,96,0.2) 0%, transparent 70%)",
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

      <div className="absolute top-[8vh] left-[8vw]">
        <p
          className="font-body uppercase"
          style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.2em" }}
        >
          Mercado
        </p>
      </div>

      <div className="absolute inset-0 flex flex-col justify-center items-center text-center">
        <p
          className="font-body uppercase mb-[2vh]"
          style={{ fontSize: "1.8vw", color: "#9d9a8c", letterSpacing: "0.15em" }}
        >
          Brasil
        </p>
        <div
          className="font-display font-bold leading-none mb-[2vh]"
          style={{ fontSize: "13vw", color: "#e8b23a" }}
        >
          800 mil
        </div>
        <p
          className="font-display"
          style={{ fontSize: "3vw", color: "#f9f7f0", letterSpacing: "0.04em" }}
        >
          salões ativos registrados
        </p>
        <div
          className="w-[4vw] h-[0.2vh] mt-[4vh]"
          style={{ background: "#e8b23a" }}
        />
      </div>

      <div
        className="absolute left-[8vw] right-[8vw] flex gap-[4vw]"
        style={{ bottom: "7vh" }}
      >
        <div
          className="flex-1 pt-[1.5vh]"
          style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
        >
          <p
            className="font-display font-bold mb-[0.5vh]"
            style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
          >
            3º lugar
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
          >
            maior mercado de beleza do mundo
          </p>
        </div>

        <div
          className="flex-1 pt-[1.5vh]"
          style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
        >
          <p
            className="font-display font-bold mb-[0.5vh]"
            style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
          >
            Abaixo de 20%
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
          >
            de penetração de software de gestão
          </p>
        </div>

        <div
          className="flex-1 pt-[1.5vh]"
          style={{ borderTop: "0.15vh solid rgba(232,178,58,0.3)" }}
        >
          <p
            className="font-display font-bold mb-[0.5vh]"
            style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
          >
            Lusofonia
          </p>
          <p
            className="font-body"
            style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
          >
            Portugal, Angola e Moçambique como expansão natural
          </p>
        </div>
      </div>
    </div>
  );
}
