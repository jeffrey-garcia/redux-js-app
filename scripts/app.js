(function() {
  // 'use strict';
  console.log("app.js loaded");

  const { Observable, from, of } = rxjs;
  const { map, filter, delay } = rxjs.operators;


  // declare the default state
  const defaultState = {
    fetchingApi: false,
    allocatedLeads: [...new Map()],
    myLeads: [...new Map()]
  };

  const digitalLeadReducer = ((state=defaultState, action={}) => {
    const { type, payload } = action;
    console.log("updating state for action type: " + type);
    console.log("current state: " + JSON.stringify(state));

    switch(type) {
      case 'API_REQUEST':
        console.log("API fetching state");
        var newState = Object.assign(
          {},
          state,
          {
            fetchingApi: true
          }
        );
        console.log(newState);
        return newState;

      case 'API_RESPONSE':
        console.log("API response state");
        console.log("add lead to state: " + JSON.stringify(payload));
        var _allocatedLeads = new Map(state.allocatedLeads);
        _allocatedLeads.set(payload.id, payload);
        var newState = Object.assign(
          {},
          state,
          {
            fetchingApi: false,
            allocatedLeads: [..._allocatedLeads],
            myLeads: [...state.myLeads]
          }
        );
        console.log(newState);
        return newState;

      case 'PUSH':
        console.log("add lead to state: " + JSON.stringify(payload));
        var _allocatedLeads = new Map(state.allocatedLeads);
        _allocatedLeads.set(payload.id, payload);
        var newState = Object.assign(
          {},
          state,
          {
            allocatedLeads: [..._allocatedLeads],
            myLeads: [...state.myLeads]
          }
        );
        console.log(newState);
        return newState;

      case 'TIMEOUT':
        console.log("remove lead from state: " + JSON.stringify(payload));
        var _allocatedLeads = new Map(state.allocatedLeads);
        _allocatedLeads.delete(payload.id, payload);
        var newState = Object.assign(
          {},
          state,
          {
            allocatedLeads: [..._allocatedLeads],
            myLeads: [...state.myLeads]
          }
        );
        console.log(newState);
        return newState;

      case 'UNLOCK':
        console.log("complete lead from state: " + JSON.stringify(payload));
        var _allocatedLeads = new Map(state.allocatedLeads);
        _allocatedLeads.delete(payload.id, payload);
        var _myLeads = new Map(state.myLeads);
        _myLeads.set(payload.id, payload);
        var newState = Object.assign(
          {},
          state,
          {
            allocatedLeads: [..._allocatedLeads],
            myLeads: [..._myLeads]
          }
        );
        console.log(newState);
        return newState;

      default:
        return state;
    }
  });

  // create a stub data until we wire-up with a real backend server
  const createLead = (function() {
    var autoId = 0;
    return (function() {
      autoId += 1;
      let lead = {
        id: autoId,
        assignedTimestamp: Date.now()
      };
      return lead;
    });
  })();

  // restful API call to remote backend server
  const getPushedDigitalLeads = (function() {
    // simulate a hard-delay of 5 seconds in network latency
    return of(createLead()).pipe(delay(5000));
  });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/
  const renderPage = (() => {
    let _isFetching = false;
    _isFetching = reduxApp.getDigitalLeadStore().getState().fetchingApi;
    if (_isFetching) {
      document.getElementById('pushNewLead').disabled = true;
    } else {
      document.getElementById('pushNewLead').disabled = false;
    }

    let _allocatedLeads;
    _allocatedLeads = reduxApp.getDigitalLeadStore().getState().allocatedLeads;
    if (_allocatedLeads) {
      let _array = Array.from(_allocatedLeads.values());
      document.getElementById('allocatedLeads').innerHTML = JSON.stringify(_array);
    }

    let _myLeads;
    _myLeads = reduxApp.getDigitalLeadStore().getState().myLeads;
    if (_myLeads) {
      let _array = Array.from(_myLeads.values());
      document.getElementById('myLeads').innerHTML = JSON.stringify(_array);
    }
  });

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/
  document.getElementById('pushNewLead').addEventListener('click', function() {
    reduxApp.dispatch(
      reduxApp.getDigitalLeadStore(),
      {
        type: "API_REQUEST"
      }
    );

    getPushedDigitalLeads().subscribe(
      (result) => {
        console.log("rest result: " + JSON.stringify(result));
        reduxApp.dispatch(
          reduxApp.getDigitalLeadStore(),
          {
            type: "API_RESPONSE",
            payload: result
          }
        );
      },
      (err) => {
        console.log("error: " + err.message);
      },
      () => {
        // default work when observable complete
        console.log("finished");
      }
    );
  });

  document.getElementById('timeoutNewLead').addEventListener('click', function() {
    let _allocatedLeads;
    _allocatedLeads = new Map(reduxApp.getDigitalLeadStore().getState().allocatedLeads);

    // simply retrieve the first element in the map
    if (_allocatedLeads.size > 0) {
      let lead = _allocatedLeads.values().next().value;
      reduxApp.dispatch(
        reduxApp.getDigitalLeadStore(),
        {
          type: "TIMEOUT",
          payload: lead
        }
      );
    }
  });

  document.getElementById('unlockNewLead').addEventListener('click', function() {
    let _allocatedLeads;
    _allocatedLeads = new Map(reduxApp.getDigitalLeadStore().getState().allocatedLeads)

    // simply retrieve the first element in the map
    if (_allocatedLeads.size > 0) {
      let lead = _allocatedLeads.values().next().value;
      reduxApp.dispatch(
        reduxApp.getDigitalLeadStore(),
        {
          type: "UNLOCK",
          payload: lead
        }
      );
    }
  });

  /************************************************************************
   *
   * Code required to start the app
   *
   ************************************************************************/

  // instantiate the redux factory instance to encapsulate direct access of redux store
  let reduxApp = {
    digitalLeadStore: (() => {
      let store = Redux.createStore(
        digitalLeadReducer,
        window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
      );
      store.subscribe(renderPage);
      return store;
    })(),
    dispatch: function(store,action) {
      console.log("action: " + JSON.stringify(action));
      store.dispatch(action);
    },
    getDigitalLeadStore: function() {
      return this.digitalLeadStore;
    }
  };

})();
