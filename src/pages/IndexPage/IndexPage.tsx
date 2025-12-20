import { Button, Cell, Switch } from '@telegram-apps/telegram-ui';
import { useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/Page.tsx';
import { useGetUserByIdQuery } from '@/services/user.service';

export const IndexPage: FC = () => {
  const navigate = useNavigate();
  const [isRequester, setIsRequester] = useState(true);

  // Switch between user IDs based on isRequester
  const userId = isRequester
    ? '69c36014-011e-4847-b964-0a44c5e0b564' // requester
    : 'fcb97f14-a258-48cd-aba9-f2ca500d66da';

  const { isLoading } = useGetUserByIdQuery(userId);

  const handleNavigateToChat = () => {
    const exampleUuid = 'ea1bdd60-39e5-438a-815b-f5f7cbe289d3';
    navigate(`/request-chat/${exampleUuid}`);
  };

  return (
    <Page back={false}>
      <Cell
        Component="label"
        after={<Switch defaultChecked onClick={() => setIsRequester(!isRequester)} />}
        description="Switch user"
      >
        Requester
      </Cell>
      {isLoading ? (
        <p>Loading user data...</p>
      ) : (
        <Button onClick={handleNavigateToChat}>
          Go to Request Chat
        </Button>
      )}
    </Page>
  );
};
