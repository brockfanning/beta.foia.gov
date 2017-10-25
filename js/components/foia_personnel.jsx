import React from 'react';
import PropTypes from 'prop-types';

function displayName(foiaPersonnel) {
  if (foiaPersonnel.name && foiaPersonnel.title) {
    return `${foiaPersonnel.name}, ${foiaPersonnel.title}`;
  }

  return foiaPersonnel.name || foiaPersonnel.title;
}

function FoiaPersonnel({ foiaPersonnel }) {
  if (!foiaPersonnel) {
    // TODO this shouldn't happen, but we don't have complete data yet
    return null;
  }

  const email = (foiaPersonnel.email || '').toLowerCase();
  return (
    <div>
      <p className="submission-help_poc">{ displayName(foiaPersonnel) }</p>
      {
        (foiaPersonnel.phone || [])
          .map(phone => <p className="submission-help_phone" key={phone} >{ phone }</p>)
      }
      { foiaPersonnel.email &&
        <p className="submission-help_email">
          <a href={`mailto:${email}`}>{ email }</a>
        </p>
      }
    </div>
  );
}

FoiaPersonnel.propTypes = {
  // TODO foiaPersonnel: PropTypes.object.isRequired,
  foiaPersonnel: PropTypes.object,
};

FoiaPersonnel.defaultProps = {
  foiaPersonnel: null,
};


export default FoiaPersonnel;
