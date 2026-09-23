import { Route, Switch } from "wouter";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import MainPage from "./components/MainPage";
import CreateCandidatePage from "./components/CreateCandidatePage";
import CandidateListPage from "./components/CandidateListPage";
import HistoryListPage from "./components/HistoryListPage";
import SessionControlPage from "./components/SessionControlPage";
import SessionResultsPage from "./components/SessionResultsPage";
import NotFoundPage from "./components/NotFoundPage";

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/" component={() => <ProtectedRoute component={MainPage} />} />
      <Route path="/create-candidate" component={() => <ProtectedRoute component={CreateCandidatePage} />} />
      <Route path="/candidates" component={() => <ProtectedRoute component={CandidateListPage} />} />
      <Route path="/history" component={() => <ProtectedRoute component={HistoryListPage} />} />
      <Route path="/history/:id">
        {(params) => <ProtectedRoute component={SessionResultsPage} params={params} />}
      </Route>
      <Route path="/experiment/:id">
        {(params) => <ProtectedRoute component={SessionControlPage} params={params} />}
      </Route>
      <Route path="/experiment/:id/results">
        {(params) => <ProtectedRoute component={SessionResultsPage} params={params} />}
      </Route>
      <Route component={NotFoundPage} />
    </Switch>
  );
}
