import {Card, CardContent} from './ui/card';
import { LoadingCard } from './LoadingCard';
const LoadingSection = ({ title, cardCount = 3 }) => (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-8">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array(cardCount).fill(0).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <LoadingCard />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
  
  export default LoadingSection