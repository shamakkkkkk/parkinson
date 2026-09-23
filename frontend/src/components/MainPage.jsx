import { useLocation } from "wouter";
import AppLayout from "./AppLayout";
import PageHeader from "./ui/PageHeader";

const TILES = [
  {
    icon: "\u2795",
    title: "Create New Candidate",
    subtitle: "Register a participant and start a session",
    path: "/create-candidate",
  },
  {
    icon: "\uD83C\uDFC3",
    title: "Select Candidate & Start Experiment",
    subtitle: "Resume or begin recording exercises",
    path: "/candidates",
  },
  {
    icon: "\uD83D\uDCC2",
    title: "View Experiments History",
    subtitle: "Review completed sessions and results",
    path: "/history",
  },
];

export default function MainPage() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Experiment Console"
        title="Main Menu"
        description="Parkinson's Disease movement & speech experiment control platform."
      />
      <div className="menu-grid">
        {TILES.map((tile) => (
          <button key={tile.path} className="menu-tile" onClick={() => setLocation(tile.path)}>
            <span className="menu-tile-icon" aria-hidden="true">{tile.icon}</span>
            <span>
              <span className="menu-tile-title" style={{ display: "block" }}>{tile.title}</span>
              <span className="menu-tile-subtitle">{tile.subtitle}</span>
            </span>
          </button>
        ))}
      </div>
    </AppLayout>
  );
}
