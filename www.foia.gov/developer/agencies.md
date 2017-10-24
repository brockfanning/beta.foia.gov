---
layout: default
use-uswds: true
permalink: /developer/agencies/
---
# FOIA.gov Draft RESTful HTTPS API Spec

This is [a draft spec](https://github.com/18F/beta.foia.gov/issues/32) for integrating
the FOIA.gov portal with existing FOIA case management systems (_e.g._,
[FOIAonline](https://foiaonline.regulations.gov/foia/action/public/home))
operated by individual agencies in the federal government. This work stems from
the interviews and research that led to our [FOIA Portal Discovery
Recommendations](https://github.com/18F/foia-recommendations/blob/master/recommendations.md).

Once an agency's case management system supports this specification, it can
receive FOIA requests directly from the FOIA.gov portal, rather than having the
request data sent to the agency via e-mail.

To minimize agency effort, we've designed this spec so that some of
the tedious bits of implementing an API can be handled by a service like
[api.data.gov](https://api.data.gov/about/), which provides a free API
management service for federal agencies.


## Receive a FOIA Request

### Notes

This draft does not address:
* versioning
* size or rate limits
* error message/status code related to exceeded the rate limit
* any subsequent calls to the internal FOIA.gov API (to capture info needed to subsequently retrieve status, for example)
* detailed security controls


### Security controls

Once we have confidence in our data models and the touch points for
interoperability, we will be working with the security team at DOJ to ensure the
Portal meets the federal requirements for security controls. For now, we include
only some preliminary ideas based on the agency feedback we’ve received.

Each agency will be responsible for implementing security controls on their own
end as per their agency regulations and authority to operate. This may include
configuration of a web application firewall, anti-virus scanning of
file attachments, and validation of HTTP headers.


#### HTTPS

Agency endpoints should be restricted to HTTPS only with valid TLS certificates.
The Portal will validate your certificate as part of the HTTPS request.


#### Authentication

To ensure that your API and case management system aren't publicly writable, we
recommend restricting your API access to the FOIA.gov Portal. This can be done
via a shared secret HTTP header token. You will provide this secret token to the
Portal though configuration. Every request from the Portal will include this
token, and your API should validate that it is the correct token.

Services like [api.data.gov](https://api.data.gov/about/) provide this authentication for you.


### URL

There are no required parameters or format for your API URL. You may choose any
pathname you wish. If your system handles requests for multiple agency
components (common for decentralized agencies), we recommend using a URL
structure that explicitly identifies the agency component receiving the FOIA
request. Your URL should not contain any query parameters.

Recommended URL format for decentralized agencies:

    /components/:id/requests/

Where `id` is a unique identifier for a component within your agency.

For example:

    /components/88/requests/

But not:

    /requests?component=88

In addition, we recommend hosting the API on a dedicated sub-domain like `foia-api.agency.gov`. Using this kind of pathname hierarchy allows us to add additional API
endpoints for future development and features.


### Method:

  `POST`


###  URL Params

**Required:**

`id=[integer]`, where `id` is the unique identifier of the agency component that should receive the request.


### Data Params

JSON payload that contains the form fields.

    Content-Type: application/json


#### Request fields

{% for field in site.data.request_fields %}
  {% assign request_field = field[1] %}
  <table class="developer_request-fields">
    <thead>
      <tr><th>Field:</th><th><code>{{ request_field.name }}</code></th></tr>
    </thead>
    <tbody>
      <tr><td class="developer_request-fields-key">Type:</td><td>{{ request_field.type }}</td></tr>
      <tr><td>Description:</td><td>{{ request_field.description }}</td></tr>
      <tr><td>Required:</td><td>{{ request_field.required }}</td></tr>
      <tr><td>Example:</td><td><code>{{ request_field.example }}</code></td></tr>
    </tbody>
  </table>
{% endfor %}


##### Sample payload

```json
{% include developer/sample_payload.json %}
```


#### Agency component specific form fields

Your agency component might have additional fields specified in your [agency
metadata file][agency-metadata-file-schema]. These additional fields are unique
to your agency and are also captured in this request payload.

These additional fields will be defined by your agency metadata file which
includes both required and optional form fields. Any fields marked `required`
will be considered required. The default is not required. The FOIA.gov portal
will ensure that required fields are present before POSTing a request to your
endpoint.

<a id="agency-form-fields-example"></a>
##### Example

Consider this sample [agency metadata
file](https://github.com/18F/beta.foia.gov/blob/master/GSA.json). A truncated version is
provided below.

```
{
    "abbreviation": "GSA",
    "components": [
        {
            // ...
            "form_fields": [
                {
                    "help_text": "If your request relates to a GSA contract, please provide the contract number (which starts with \"GS-\")",
                    "label": "GS- Contract number",
                    "name": "contract_number"
                },
                {
                    "help_text": "(i.e. New England Region (1A) - States Served: CT, MA, ME, NH, RI, VT",
                    "label": "GSA Region",
                    "name": "region"
                },
                {
                    "enum": [
                        "Company",
                        "Individual/Self",
                        "Organization"
                    ],
                    "help_text": "Company",
                    "label": "Request Origin",
                    "name": "request_origin",
                    "regs_url": null,
                    "required": true
                }
            ]
        }
    ]
}
```

Therefore, the payload has these additional fields.

- (required) `request_origin`
- `contract_number`
- `region`

So in addition to the fields in the [above request payload](#request-fields),
these fields might appear for GSA.

```
{
    "name_first": "George",
    "name_last": "Washington"
    // ... standard request fields ...

    // agency component specific fields appear within payload
    "contract_number": "5547",
    "region": "9",
    "request_origin": "Individual/Self"
}
```


### Responses

Responses should be in `application/json` format and include an appropriate HTTP
status code.


#### Success Response

**Code:** | 200 OK
:--- |:---
**Content:** | `{ "id" : 33, "status_tracking_number": "doj-1234" }`
**Meaning:** | Confirm that the request was created and return an `id` that can uniquely identify the request in the case management system. The status tracking number (required) will be sent to the requester and used to track a request in your case management system.


#### Error Response

**Code:** | 404 NOT FOUND
:--- |:---
**Content:** | `{ "code" : "A234", "message" : "agency component not found", "description": "description of the error that is specific to the case management system"}`
**Meaning:** | The target agency component specified in URI was not found (error payload includes a place for a system-specific message, to make it easier to track down problems)

**Code:** | 500 INTERNAL SERVER ERROR
:--- |:---
**Content:** | `{ "code" : "500", "message" : "internal error", "description": "description of the error that is specific to the case management system"}`
**Meaning:** | The case management system encountered an internal error when trying to create the FOIA request (error payload includes a place for a system-specific message, to make it easier to track down problems)


### Sample request

```
$ curl -X POST -H "Content-Type: application/json" -d @- https://foia-api.agency.gov/components/234/requests <<EOF
{% include developer/sample_payload.json %}
EOF
```

[agency-metadata-file-schema]: https://github.com/18F/foia-recommendations/blob/master/schemas.md#agency-metadata-file
