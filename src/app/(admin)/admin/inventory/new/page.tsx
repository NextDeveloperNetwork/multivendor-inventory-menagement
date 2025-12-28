import { getSelectedBusinessId } from '@/app/actions/business';
import NewProductClient from '@/components/NewProductClient';

export default async function NewProductPage() {
    const selectedBusinessId = await getSelectedBusinessId();

    return <NewProductClient selectedBusinessId={selectedBusinessId} />;
}
