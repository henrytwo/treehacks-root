import React from 'react';
import { connect } from 'react-redux';
import './Transportation.scss';
import { setPage, setData, saveData, loadData, getUserProfile, submitForm, setFormName } from "../store/form/actions";
import Loading from "../Loading/Loading";
import FormPage from '../FormPage/FormPage';
import { STATUS, TYPE, TRANSPORTATION_STATUS, TRANSPORTATION_TYPES, TRANSPORTATION_BUS_ROUTES,
  TRANSPORTATION_DEADLINES, TRANSPORTATION_BUS_ROUTE_DETAILS } from '../constants';
import { ITransportationProps } from './types';
import RouteMap from './RouteMap';
import FlightReimbursementHeader from './FlightReimbursementHeader';
import moment from "moment-timezone";
import TravelReimbursementHeader from './TravelReimbursementHeader';
import TransportationExpired from './TransportationExpired';

declare var MODE: string;

const mapStateToProps = state => ({
    ...state.form
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  loadData: () => { dispatch(loadData()) },
  getUserProfile: () => dispatch(getUserProfile()),
  setFormName: (e: string) => dispatch(setFormName(e)),
  setData: (e, userEdited) => dispatch(setData(e, userEdited)),
  saveData: () => dispatch(saveData()),
  submitForm: () => dispatch(submitForm())
});

export class Transportation extends React.Component<ITransportationProps> {
  constructor(props) {
    super(props);

    this.submitBusAcceptance = this.submitBusAcceptance.bind(this);
  }

  submitBusAcceptance(accept, deadlinePassed) {
    if (!deadlinePassed || window.confirm("Are you sure you want to decline your RSVP? Since the transportation deadline has passed, this will be final.")) {
      this.props.setData({ accept }, true);
      this.props.saveData();
    }
  }

  render() {
    if (MODE === 'DEV') {
      if (window.location.search.indexOf('simulate=') !== -1) {
        this.props.profile.status = STATUS.ADMISSION_CONFIRMED;

        if (window.location.search.indexOf('simulate=bus') !== -1) {
          this.props.profile.admin_info.transportation = { type: TRANSPORTATION_TYPES.BUS, id: TRANSPORTATION_BUS_ROUTES.USC, deadline: "2048-11-28T04:39:47.512Z" };
        } else if (window.location.search.indexOf('simulate=flight') !== -1) {
          this.props.profile.admin_info.transportation = { type: TRANSPORTATION_TYPES.FLIGHT, amount: 500, deadline: "2048-11-28T04:39:47.512Z" };

        } else if (window.location.search.indexOf('simulate=other') !== -1) {
          this.props.profile.admin_info.transportation = { type: TRANSPORTATION_TYPES.OTHER, amount: 100, deadline: "2048-11-28T04:39:47.512Z" };

        }
      }
    }

    const {
      status,
      type,
      admin_info: { transportation },
      transportation_status
    } = this.props.profile;

    const transportationDeadline = moment(transportation && transportation.deadline);
    const formattedDeadline = transportationDeadline.tz("America/Los_Angeles").format("LLL z");
    const transportationType = (transportation && transportation.type) || "";
    const transportationAmount = (transportation && transportation.amount) || 0;
    const dateNow = moment();
    const deadlinePassed = dateNow > transportationDeadline;
    let transportationForm = this.props.formData || {};
    if (status !== STATUS.ADMITTED && status !== STATUS.ADMISSION_CONFIRMED) {
      // No travel info to show
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '500px', marginTop: '60px', padding: '20px', color: 'white', textAlign: 'center' }}>
            <span>There are no travel options at this time.&nbsp;</span>
            {status !== STATUS.ADMISSION_DECLINED && <span>Check back after you have received a decision about your application.</span>}
            {status === STATUS.ADMISSION_DECLINED && <span>You have declined your admission, so no transportation options are available.</span>}
          </div>
        </div>
      );
    }
    if (transportation_status === TRANSPORTATION_STATUS.UNAVAILABLE) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '700px', marginTop: '60px', padding: '40px 20px', color: 'white', textAlign: 'center' }}>
            <h4>You have not been given a travel reimbursement.</h4>
            <p style={{maxWidth: 500, margin: '20px auto 0'}}>It looks like you're coming from close by, so we aren't planning to coordinate travel for you. Let us know if we made a mistake!</p>
          </div>
        </div>
      );

    }
    
    if (transportationType === TRANSPORTATION_TYPES.BUS) {
      const route = TRANSPORTATION_BUS_ROUTE_DETAILS[transportation.id] || [];

      if (deadlinePassed && transportationForm.accept !== true) {
        return <div className="transportation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '750px', margin: '60px', padding: '40px 20px', color: 'white', textAlign: 'center' }}>
            <TransportationExpired />
          </div></div>;
      }

      return (
        <div className="transportation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '750px', margin: '60px', padding: '40px 20px', color: 'white', textAlign: 'center' }}>
            <h4>You have been placed on a bus!</h4>
            <p style={{maxWidth: 575, margin: '20px auto 0'}}>We are running free buses from locations in California, and we would like you to offer a spot on one :) Buses leave on Friday morning and return Sunday night. If you would like a spot on the bus listed below, you must RSVP on this page by <strong>{formattedDeadline}</strong>. The bus will be first come, first served, but this shows us approximately how many seats we need. If you do not fill out this form, you will <u><strong>not</strong></u> be allowed to board the bus. Because you are near a bus, we do not anticipate offering you other travel reimbursement options.</p>
            <p style={{maxWidth: 575, margin: '20px auto 0'}}>You <u><strong>must</strong></u> have a <u><strong>government-issued ID</strong></u> to get on the bus (this is because you must have one to check-in at TreeHacks!). Your bus coordinators will be checking IDs, and they will not be able to save a spot for you if you forget your ID. Because the bus is first come, first served, we recommend getting to your pickup spot early during the check in process. Buses depart 30 minutes after check-in begins or until spots are filled, whichever is first. Times on this page are tentative until February 1st.</p>

            <div style={{margin: 40, padding: 20, backgroundColor: '#535152'}}>
              <p><small>We will add information for your bus coordinator in the weeks leading up to the event. If you have questions in the meantime, please reach out to hello@treehacks.com.</small></p>
              <RouteMap route={route} />
            </div>

            <h5>{transportationForm.accept ? "Thanks, we've received your RSVP" :  <span>You must RSVP by <strong>{formattedDeadline}</strong></span>}</h5>

            {status === STATUS.ADMITTED ?
              <p style={{maxWidth: 575, margin: '20px auto 0'}}>After you confirm your spot using the dashboard, you can use this page to submit your RSVP and reserve your spot on the bus.</p>
            :
              <div className="btn-container" style={{marginBottom: 0}}>
                  <div>
                      <input
                          className="btn btn-custom inverted"
                          type="submit"
                          value="cancel RSVP"
                          style={!transportationForm.accept ? { opacity: 0.5, pointerEvents: 'none' } : {}}
                          disabled={!transportationForm.accept}
                          onClick={e => { e.preventDefault(); this.submitBusAcceptance(false, deadlinePassed); }}
                      />
                      <input
                          className="btn btn-custom"
                          type="submit"
                          value="RSVP"
                          disabled={transportationForm.accept}
                          onClick={e => { e.preventDefault(); this.submitBusAcceptance(true, deadlinePassed); }}
                      />
                  </div>
              </div>
            }
            {transportationForm.accept ?
              <p><small>We've received your RSVP! You can cancel your RSVP anytime up to the event if your plans change.</small></p>
            : null}
          </div>
        </div>
      );

    }
    
    if (transportationType === TRANSPORTATION_TYPES.FLIGHT || transportationType === TRANSPORTATION_TYPES.OTHER) {
      if (dateNow > transportationDeadline) {
        return <TransportationExpired />;
      }

      return (
        <div className="transportation" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#686e77', width: '100%', maxWidth: '750px', margin: '60px', padding: '40px 20px', color: 'white', textAlign: 'center' }}>
            
            {transportationType === TRANSPORTATION_TYPES.FLIGHT && <FlightReimbursementHeader />}
            {transportationType === TRANSPORTATION_TYPES.OTHER && <TravelReimbursementHeader /> }

            <h5 style={{marginTop: 40}}>{transportation_status === TRANSPORTATION_STATUS.SUBMITTED ? "Thanks, we've received your receipt" :  <span>Receipts must be uploaded by <strong>{formattedDeadline}</strong></span>}</h5>
            <h5>TreeHacks is reimbursing you up to <span style={{color: '#00b65f', fontWeight: 'bold'}}>{transportationAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></h5>
            
            {status === STATUS.ADMITTED ?
              <p style={{maxWidth: 575, margin: '20px auto 0'}}>After you confirm your spot using the dashboard, you can use this page to upload your receipts and request reimbursement.</p>
            : transportation_status === TRANSPORTATION_STATUS.SUBMITTED ?
              <p style={{maxWidth: 575, margin: '20px auto 0'}}>Thanks, we've received your reimbursement request.</p>
            :
              <div>
                <p style={{maxWidth: 575, margin: '20px auto -20px', fontStyle: 'italic'}}>If you have multiple receipts, please combine them into a single PDF prior to uploading. You can only submit this form once.</p>
                <FormPage
                  submitted={false}
                  onChange={e => {
                      const userEdited = JSON.stringify(e.formData) !== JSON.stringify(transportationForm);
                      this.props.setData(e.formData, userEdited);
                  }}
                  onError={() => window.scrollTo(0, 0)}
                  onSubmit={(e) => {
                    this.props.saveData().then(() => {
                      this.props.submitForm().then(() => this.props.getUserProfile());;
                    });
                  }}
                  schema={this.props.schemas.transportation.schema}
                  uiSchema={this.props.schemas.transportation.uiSchema}
                  formData={transportationForm}
                >
                  <div className="btn-container" style={{marginBottom: 0}}>
                      <div>
                        <input
                          className="btn btn-custom"
                          type="submit"
                          value="submit receipt"
                        />
                      </div>
                    </div>
                </FormPage>
              </div>
            }
          </div>
        </div>
      );
    }
  }
}

class TransportationWrapper extends React.Component<ITransportationProps, {}> {
  componentDidMount() {
    this.props.setFormName('transportation');
    this.props.loadData();
    this.props.getUserProfile();
  }
  render() {
      if (!this.props.formData || !this.props.profile) {
        return <Loading />;
      }
      return <Transportation {...this.props}  />;
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(TransportationWrapper);