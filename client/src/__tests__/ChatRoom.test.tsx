import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChatRoom from "../pages/ChatRoom";

const renderWithRouter = (component: React.ReactElement) => {
    return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('chat room page', () => {
    it('Espresso Chat is present', () => {
        renderWithRouter(<ChatRoom />);
        const titleElement = screen.getByText('☕ Espresso Chat');
        expect(titleElement).toBeInTheDocument();
    })

    it('Room is present', () => {
        renderWithRouter(<ChatRoom />);
        const roomElement = screen.getByText('Room:');
        expect(roomElement).toBeInTheDocument();
    })

    it('Users is present', () => {
        renderWithRouter(<ChatRoom />);
        const usersElement = screen.getByText('Users');
        expect(usersElement).toBeInTheDocument();
    })

    it('share room link button is present', async () => {
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(),
            }
        });

        renderWithRouter(<ChatRoom />);
        const shareRoomLinkButton = screen.getByRole('button', { name: /Share Room Link/i });
        
        await userEvent.click(shareRoomLinkButton);
    })
    
    it('leave room button is present', async () => {
        renderWithRouter(<ChatRoom />);
        const leaveRoomButton = screen.getByRole('button', { name: /Leave Room/i });

        await userEvent.click(leaveRoomButton);
    })

    it('send message button is present', async () => {
        renderWithRouter(<ChatRoom />);
        const sendMessageButton = screen.getByRole('button', { name: /Send/i });

        await userEvent.click(sendMessageButton);
    })

    it('enter message input is present', () => {
        renderWithRouter(<ChatRoom />);
        const messageInputElement = screen.getByPlaceholderText('Enter Message');
        expect(messageInputElement).toBeInTheDocument();
    })



})