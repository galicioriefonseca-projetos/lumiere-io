export default function Encerramento() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(19,39,96,0.4) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,178,58,0.04) 0%, transparent 60%)",
        }}
      />

      <div
        className="absolute top-0 left-[8vw] right-[8vw]"
        style={{
          height: "0.2vh",
          background:
            "linear-gradient(90deg, transparent, #e8b23a 20%, #e8b23a 80%, transparent)",
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-[8vw]">
        <div
          className="w-[3vw] h-[0.2vh] mb-[4vh]"
          style={{ background: "#e8b23a" }}
        />
        <h1
          className="font-display font-bold tracking-tight leading-none mb-[3vh]"
          style={{ fontSize: "7vw", color: "#f9f7f0" }}
        >
          Lumière.io
        </h1>
        <p
          className="font-display font-light mb-[5vh]"
          style={{ fontSize: "2.5vw", color: "#9d9a8c", letterSpacing: "0.08em" }}
        >
          Gestão de elite para o mercado lusófono.
        </p>
        <div
          className="w-[3vw] h-[0.2vh] mb-[4vh]"
          style={{ background: "#e8b23a" }}
        />
        <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
          contato@lumiere.io · lumiere.io
        </p>
      </div>

      <div
        className="absolute bottom-0 left-[8vw] right-[8vw]"
        style={{
          height: "0.2vh",
          background:
            "linear-gradient(90deg, transparent, #e8b23a 20%, #e8b23a 80%, transparent)",
        }}
      />
    </div>
  );
}
