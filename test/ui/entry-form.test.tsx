import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EntryForm } from "../../src/EntryForm";

describe("EntryForm", () => {
  it("submits a parsed positive amount on Dodaj", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EntryForm onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Kwota"), "149,50");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));

    expect(onSubmit).toHaveBeenCalledWith(14950, undefined);
  });

  it("submits a negative amount on Zabierz", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EntryForm onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Kwota"), "149,50");
    await user.click(screen.getByRole("button", { name: "Zabierz" }));

    expect(onSubmit).toHaveBeenCalledWith(-14950, undefined);
  });

  it("passes an optional description along", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EntryForm onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Kwota"), "100");
    await user.type(screen.getByLabelText("Opis"), "LEGO z karetką");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));

    expect(onSubmit).toHaveBeenCalledWith(10000, "LEGO z karetką");
  });

  it("shows a Polish error for an invalid amount and does not submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<EntryForm onSubmit={onSubmit} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Kwota"), "abc");
    await user.click(screen.getByRole("button", { name: "Dodaj" }));

    expect(screen.getByText("Nieprawidłowa kwota")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
