import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import FinalExam from './pages/FinalExam.jsx';
import Home from './pages/Home.jsx';
import MockInterview from './pages/MockInterview.jsx';
import NotFound from './pages/NotFound.jsx';
import Review from './pages/Review.jsx';
import TrackPage from './pages/TrackPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="track/:trackId" element={<TrackPage />} />
        <Route path="exam" element={<FinalExam />} />
        <Route path="review" element={<Review />} />
        <Route path="interview" element={<MockInterview />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
