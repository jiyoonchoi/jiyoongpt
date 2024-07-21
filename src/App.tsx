import Login from "./components/Login";
import { Route, Switch } from "wouter";
import UserPage from "./components/UserPage";
import Prompt from "./components/Prompt";

const App = () => {
  return (
    <>
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/users/:name" component={UserPage} />
        <Route path="/Prompt" component={Prompt} />

        {/* Shows a 404 error if the path doesn't match anything */}
        {
          <Route>
            <p className="p-4">404: Page Not Found</p>
          </Route>
        }
      </Switch>
    </>
  );
};

export default App;
