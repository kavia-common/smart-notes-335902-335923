import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Smart Notes shell", () => {
  render(<App />);
  expect(screen.getByText(/smart notes/i)).toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /new note/i })[0]).toBeInTheDocument();
});
