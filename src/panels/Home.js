import { Panel, PanelHeader, Header, Button, Group, Cell, Div, Avatar } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import PropTypes from 'prop-types';
import bridge from '@vkontakte/vk-bridge';
import { useState } from 'react';
import BackgroundImage from '../assets/background.png';

export const Home = ({ id, fetchedUser }) => {
  const { photo_200, city, first_name, last_name } = { ...fetchedUser };
  const routeNavigator = useRouteNavigator();
  const [loading, setLoading] = useState(false);

  const getRandomCatPhoto = async () => {
    return `https://cataas.com/cat`;
  };

  const getRandomCatFact = async () => {
    try {
      const response = await fetch('https://catfact.ninja/fact');
      if (!response.ok) {
        throw new Error(`error in request - status: ${response.status}`);
      }

      const data = await response.json();
      return data.fact;

    } catch (error) {
      console.error('error in getting random cat fact:', error);
      return null;
    }
  };

  const createImageWithText = (text) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
  
      canvas.width = 1080;
      canvas.height = 1920;

      const backgroundImg = new Image();
      backgroundImg.src = BackgroundImage;
      backgroundImg.onload = () => {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

        ctx.font = 'bold 48px American Typewriter';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
  
        const words = text.split(' ');
        let cur = words[0];
        const maxWidth = canvas.width - 300;
        const lines = [];
        for (let i = 1; i < words.length; i++) {
          const metrics = ctx.measureText(cur + ' ' + words[i]);
          if (metrics.width > maxWidth) {
            lines.push(cur);
            cur = words[i];
          } else {
            cur = cur + ' ' + words[i];
          }
        }
        lines.push(cur);
  
        const heightBtwLines = 70;
        const startY = (canvas.height - (lines.length * heightBtwLines)) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, startY + (index * heightBtwLines));
        });
  
        resolve(canvas.toDataURL('image/jpeg', 1));
      };
  
      backgroundImg.onerror = () => {
        console.error('error occured in background image loading');
        resolve(null);
      };
    });
  };

  const createStory = async () => {
    setLoading(true);
    try {
      let imageUrl;
      if (Math.random() < 0.5) {
        imageUrl = await getRandomCatPhoto();
      } else {
        const factText = await getRandomCatFact();
        if (!factText) {
          console.error('the fact has not been loaded');
          return;
        }
        imageUrl = await createImageWithText(factText);
        if (!imageUrl) {
          console.error('creating background image with fact failed - story will not be created');
          return;
        }
      }

      await bridge.send('VKWebAppShowStoryBox', {
        background_type: 'image',
        url: imageUrl,
        locked: true
      });
    } catch (error) {
      console.error('error occured in story creation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel id={id}>
      <PanelHeader>Главная</PanelHeader>
      {fetchedUser && (
        <Group header={<Header size="s">User Data Fetched with VK Bridge</Header>}>
          <Cell before={photo_200 && <Avatar src={photo_200} />} subtitle={city?.title}>
            {`${first_name} ${last_name}`}
          </Cell>
        </Group>
      )}

      <Group header={<Header size="s">Navigation Example</Header>}>
        <Div>
          <Button stretched size="l" mode="secondary" onClick={() => routeNavigator.push('persik')}>
            Покажите Персика, пожалуйста!
          </Button>
        </Div>
        <Div>
          <Button stretched size="l" mode="secondary" onClick={createStory} disabled={loading}>
            {loading ? 'Загрузка' : 'Создать историю с кото-фотом или кото-фактом'}
          </Button>
        </Div>
      </Group>
    </Panel>
  );
};

Home.propTypes = {
  id: PropTypes.string.isRequired,
  fetchedUser: PropTypes.shape({
    photo_200: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    city: PropTypes.shape({
      title: PropTypes.string,
    }),
  }),
};