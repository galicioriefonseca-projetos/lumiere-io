export default function ASolucao() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 92% 50%, rgba(232,178,58,0.05) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "8vw",
          top: "15vh",
          bottom: "15vh",
          width: "0.3vw",
          background:
            "linear-gradient(180deg, transparent, #e8b23a 30%, #e8b23a 70%, transparent)",
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

      <div className="absolute inset-0 flex flex-col justify-center px-[14vw]">
        <p
          className="font-body uppercase mb-[3vh]"
          style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.2em" }}
        >
          A Solução
        </p>
        <h2
          className="font-display font-bold tracking-tight leading-tight mb-[4vh]"
          style={{ fontSize: "5.5vw", color: "#f9f7f0" }}
        >
          <span className="block">Uma plataforma.</span>
          <span className="block" style={{ color: "#e8b23a" }}>
            Total controle.
          </span>
        </h2>
        <div
          className="w-[5vw] h-[0.2vh] mb-[4vh]"
          style={{ background: "#e8b23a" }}
        />
        <p
          className="font-body"
          style={{
            fontSize: "2.2vw",
            color: "#9d9a8c",
            lineHeight: 1.65,
            maxWidth: "55vw",
            textWrap: "pretty",
          }}
        >
          Lumière reúne agendamentos, avaliações, comissões, metas e gamificação em
          uma plataforma web e mobile — construída para o mercado brasileiro e lusófono.
        </p>
      </div>
    </div>
  );
}
