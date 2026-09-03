import Footer from '@/components/footer';
import Navbar from '@/components/navbar';

export const metadata = {
    title: 'Emporium Capitals | Home',
    description: 'Comece sua jornada de renda passiva com a Emporium Capitals. Sem esforço algum — nós gerenciamos o processo e você recebe os lucros.',
};

export default function Layout({ children }) {
    return (
        <>
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
