import React, { Component } from 'react';
import classnames from 'classnames';
import axios from 'axios';

import Loading from './Loading';
import Panel from './Panel';
import {
  getInterviewsPerDay,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getTotalInterviews,
} from 'helpers/selectors';
import { setInterview } from 'helpers/reducers';

const data = [
  {
    id: 1,
    label: 'Total Interviews',
    getValue: getTotalInterviews,
  },
  {
    id: 2,
    label: 'Least Popular Time Slot',
    getValue: getLeastPopularTimeSlot,
  },
  {
    id: 3,
    label: 'Most Popular Day',
    getValue: getMostPopularDay,
  },
  {
    id: 4,
    label: 'Interviews Per Day',
    getValue: getInterviewsPerDay,
  },
];

class Dashboard extends Component {
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {},
  };

  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem('focused'));
    if (!!focused) this.setState({ focused });

    Promise.all([
      axios.get('/api/days'),
      axios.get('/api/appointments'),
      axios.get('/api/interviewers'),
    ]).then(([d, a, i]) => {
      this.setState({
        loading: false,
        days: d.data,
        appointments: a.data,
        interviewers: i.data,
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);
    this.socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (typeof data === 'object' && data.type === 'SET_INTERVIEW') {
        this.setState((prev) => setInterview(prev, data.id, data.interview));
      }
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.focused !== this.state.focused) {
      localStorage.setItem('focused', JSON.stringify(this.state.focused));
    }
  }

  componentWillUnmount() {
    this.socket.close();
  }

  selectPanel(id) {
    this.setState((prev) => ({
      focused: prev.focused !== null ? null : id,
    }));
  }
  render() {
    const dashboardClasses = classnames('dashboard', {
      'dashboard--focused': this.state.focused,
    });
    if (this.state.loading) return <Loading />;
    const panels = data
      .filter(
        ({ id }) => this.state.focused === null || this.state.focused === id
      )
      .map(({ id, label, getValue }) => (
        <Panel
          label={label}
          value={getValue(this.state)}
          key={id}
          onSelect={() => this.selectPanel(id)}
        />
      ));
    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
