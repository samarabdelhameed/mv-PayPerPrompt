function App() {
  return (
    <div className="app">
      <header>
        <h1>PayPerPrompt</h1>
        <p>Decentralized AI Payment Infrastructure</p>
      </header>
      
      <main>
        <section className="hero">
          <h2>Pay for AI, One Prompt at a Time</h2>
          <button>Connect Wallet</button>
        </section>

        <section className="features">
          <div className="feature">
            <h3>Agent Registry</h3>
            <p>Register and discover AI agents</p>
          </div>
          <div className="feature">
            <h3>x402 Payments</h3>
            <p>Seamless invoice handling</p>
          </div>
          <div className="feature">
            <h3>Fair Revenue Split</h3>
            <p>85% to agents, 15% platform fee</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
