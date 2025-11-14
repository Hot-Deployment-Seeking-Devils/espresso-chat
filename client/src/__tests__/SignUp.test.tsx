import userEvent from "@testing-library/user-event"
import SignUp from "../pages/SignUp";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('sign up', () => {
    it('sign up page title is present', () => {
        renderWithRouter(<SignUp />);
        const titleElement = screen.getByText('Sign Up');
        expect(titleElement).toBeInTheDocument();
    })      
    
    it('coming soon subtitle is present', () => {
        renderWithRouter(<SignUp />);
        const subtitleElement = screen.getByText('Coming soon...');
        expect(subtitleElement).toBeInTheDocument();    
    })

    it('back to home button is present', async () => {
        renderWithRouter(<SignUp />);
        const backToHomeButton = screen.getByRole('button', { name: /← Back to Home/i });

        await userEvent.click(backToHomeButton);
    })
})
