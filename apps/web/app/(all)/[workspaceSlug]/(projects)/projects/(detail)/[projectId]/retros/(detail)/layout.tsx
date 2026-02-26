import { Outlet } from "react-router";

export default function RetroDetailLayout() {
  console.log("Retro Detail Layout Rendered");
  return (
    <div className="h-full w-full">
      <Outlet /> 
    </div>
  );
}