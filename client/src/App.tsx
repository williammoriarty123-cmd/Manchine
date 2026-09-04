import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import NumberMemory from "./pages/NumberMemory";
import ReactionTime from "./pages/ReactionTime";
import SequenceMemory from "./pages/SequenceMemory";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reaction-time" component={ReactionTime} />
      <Route path="/sequence-memory" component={SequenceMemory} />
      <Route path="/number-memory" component={NumberMemory} />
      <Route component={SequenceMemory} />
    </Switch>
  );
}
