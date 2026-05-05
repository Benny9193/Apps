import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>web-react template</h1>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
    </main>
  );
}
