import "./App.css";
import {
  AndroidView,
  DesktopView,
  IOSView,
  MobileView,
} from "../deviceDetector";

function App() {
  return (
    <div className="App">
      <AndroidView>hey android</AndroidView>
      <br />
      <DesktopView>hello desktop</DesktopView>
      <br />
      <MobileView>hello mobile</MobileView>
      <br />
      <IOSView>hello ios</IOSView>
    </div>
  );
}

export default App;
