import userEvent from "@testing-library/user-event";
import Landing from "../pages/Landing";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe("Landing Page", () => {
    it("Espresso Chat title is present", () => {
        renderWithRouter(<Landing />);
        const titleElement = screen.getByText("Espresso Chat");
        expect(titleElement).toBeInTheDocument();
    })

    it("subtitle is present", () => {
        renderWithRouter(<Landing />);
        const subtitleElement = screen.getByText("Quick chats, instant connections");
        expect(subtitleElement).toBeInTheDocument();
    })

    it("Already Have an account? section is present", () => {
        renderWithRouter(<Landing />);
        const accountSection = screen.getByText("Already Have an account?");
        expect(accountSection).toBeInTheDocument();
    })

    it("Footer text No registration required for anonymous rooms is present", () => {
        renderWithRouter(<Landing />);
        const footerText = screen.getByText("No registration required for anonymous rooms");
        expect(footerText).toBeInTheDocument();
    })  

    it("Create anonymous room button is present", async () => {
        renderWithRouter(<Landing />);
        const createRoomButton = screen.getByRole("button", {name: /Start Anonymous Chat Room/i});
    
        await userEvent.click(createRoomButton);
    })
    
    it("Login button is present", async () => {
        renderWithRouter(<Landing />);
        const loginButton = screen.getByRole("button", {name: /Login/i});

        await userEvent.click(loginButton);
    })  

    it("Sign Up button is present", async () => {
        renderWithRouter(<Landing />);
        const signUpButton = screen.getByRole("button", {name: /Sign Up/i});
       
        await userEvent.click(signUpButton);
    })  

  
})