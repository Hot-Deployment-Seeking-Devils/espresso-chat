import userEvent from "@testing-library/user-event"
import Login from "../pages/Login";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('Login',() => {
    it('login page title is present', () => {
        renderWithRouter(<Login />);
        const titleElement = screen.getByText('Login');
        expect(titleElement).toBeInTheDocument();
    })
    
    it('coming soon subtitle is present', () => {
        renderWithRouter(<Login />);
        const subtitleElement = screen.getByText('Coming soon...');
        expect(subtitleElement).toBeInTheDocument();
    })  

    it('back to home button is present', async () => {
        renderWithRouter(<Login />);
        const backToHomeButton = screen.getByRole('button', { name: /← Back to Home/i });

        await userEvent.click(backToHomeButton);
    })


})