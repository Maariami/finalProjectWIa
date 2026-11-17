import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserDto } from '../../models/auth.model';
import { AuthenticationService } from '../../services/authentication.service';
import { AccountComponent } from './account.component';

const user: UserDto = {
  id: 'user-id',
  email: 'person@example.com',
  firstName: 'First',
  lastName: 'Last',
  fullName: 'First Last',
  phoneNumber: null,
  avatarUrl: null,
  role: 'Customer',
  emailConfirmed: true,
  createdAt: new Date().toISOString(),
};

const authenticationService = {
  currentUser: vi.fn(() => user),
  getCurrentUser: vi.fn<AuthenticationService['getCurrentUser']>(),
};

describe('AccountComponent', () => {
  let fixture: ComponentFixture<AccountComponent>;

  beforeEach(() => {
    authenticationService.getCurrentUser.mockReset();
    authenticationService.getCurrentUser.mockReturnValue(of(user));
    TestBed.configureTestingModule({
      imports: [AccountComponent],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    });
    fixture = TestBed.createComponent(AccountComponent);
    fixture.detectChanges();
  });

  it('loads and displays the current user without assuming optional contact details', () => {
    expect(authenticationService.getCurrentUser).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('First Last');
    expect(fixture.nativeElement.textContent).toContain('person@example.com');
    expect(fixture.nativeElement.textContent).toContain('Customer');
    expect(fixture.nativeElement.textContent).not.toContain('null');
  });
});
